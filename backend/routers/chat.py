"""Read-only chat grounded in the signed-in user's stored contract analyses."""
import asyncio
import json
import logging
import os
from decimal import Decimal
from typing import Optional

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from config import ai_client, contracts_table
from deps import get_current_user

logger = logging.getLogger("legalvault")

router = APIRouter(tags=["Chat"])

MAX_VAULT_CHARS = 14000
MAX_SINGLE_SUMMARY = 6000
MAX_THREAD_MESSAGES = 16
MAX_MESSAGE_CHARS = 2000

SYSTEM_PROMPT = """You are a read-only assistant for one person's contract vault.
Answer only from the contract facts below. Those facts are stored analyses: subject, party, dates, summary, and risks. You do not have the PDF and must not pretend you read one.
If the facts do not contain the answer, say so.
You cannot delete contracts, edit them, or change reminders. If asked to do any of those, say you can only answer questions.
Do not invent parties, dates, or risks."""


class ChatTurn(BaseModel):
    role: str
    content: str = ""


class ChatRequest(BaseModel):
    message: str = ""
    contract_id: Optional[str] = None
    messages: list[ChatTurn] = Field(default_factory=list)


def _parse_analysis(raw) -> dict:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        return data if isinstance(data, dict) else {}
    return {}


def _as_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, default=str)
    return str(value).strip()


def _facts(item: dict) -> Optional[dict]:
    data = _parse_analysis(item.get("analysis"))
    if data.get("status") == "analyzing" and not data.get("summary"):
        return None
    dates = {}
    for key, value in data.items():
        if not isinstance(key, str):
            continue
        lower = key.lower()
        if "date" in lower or lower in {"expiry", "expiry_date"}:
            text = _as_text(value)
            if text:
                dates[key] = text
    notice = _as_text(data.get("notice_period_days"))
    if notice and notice != "0":
        dates["notice_period_days"] = notice
    flags = data.get("risk_flags") or []
    if not isinstance(flags, list):
        flags = [flags]
    return {
        "contract_id": _as_text(item.get("contract_id")),
        "subject": _as_text(data.get("subject")),
        "party": _as_text(data.get("party")),
        "dates": dates,
        "summary": _as_text(data.get("summary")),
        "risks": {
            "risk_flags": [_as_text(flag) for flag in flags if _as_text(flag)],
            "risk_flags_note": _as_text(data.get("risk_flags_note")),
        },
    }


def _dump(facts: dict, summary_limit: Optional[int]) -> str:
    payload = dict(facts)
    summary = payload.get("summary") or ""
    if summary_limit is not None and len(summary) > summary_limit:
        payload["summary"] = summary[:summary_limit].rstrip() + "…"
    return json.dumps(payload, ensure_ascii=False)


def _trim_vault(facts_list: list[dict]) -> tuple[str, int]:
    """Keep newest facts inside a character budget. Returns text and how many were dropped."""
    if not facts_list:
        return "", 0

    def pack(rows: list[dict], limit: Optional[int]) -> str:
        return "\n".join(_dump(row, limit) for row in rows)

    if len(pack(facts_list, None)) <= MAX_VAULT_CHARS:
        return pack(facts_list, None), 0

    best_limit = 80
    lo, hi = 80, 2000
    while lo <= hi:
        mid = (lo + hi) // 2
        if len(pack(facts_list, mid)) <= MAX_VAULT_CHARS:
            best_limit = mid
            lo = mid + 1
        else:
            hi = mid - 1
    if len(pack(facts_list, best_limit)) <= MAX_VAULT_CHARS:
        return pack(facts_list, best_limit), 0

    kept = list(facts_list)
    omitted = 0
    while kept and len(pack(kept, 80)) > MAX_VAULT_CHARS:
        kept.pop()
        omitted += 1
    return pack(kept, 80), omitted


def _load_contracts(user_id: str) -> list[dict]:
    items: list[dict] = []
    params = {"KeyConditionExpression": Key("user_id").eq(user_id)}
    while True:
        res = contracts_table.query(**params)
        items.extend(res.get("Items", []))
        last = res.get("LastEvaluatedKey")
        if not last:
            break
        params["ExclusiveStartKey"] = last
    items.sort(key=lambda item: _as_text(item.get("timestamp")), reverse=True)
    return items


def _context(items: list[dict], contract_id: Optional[str]) -> str:
    if contract_id:
        match = next((item for item in items if _as_text(item.get("contract_id")) == contract_id), None)
        if match is None:
            raise HTTPException(status_code=404, detail="Contract not found")
        facts = _facts(match)
        if facts is None:
            return "This contract is still being analyzed, so there is no stored summary yet."
        return _dump(facts, MAX_SINGLE_SUMMARY)

    facts_list = [facts for item in items if (facts := _facts(item))]
    text, omitted = _trim_vault(facts_list)
    if not text:
        return "This vault has no stored contract analyses yet."
    if omitted:
        text += f"\n{omitted} older contracts were left out so the vault would fit."
    return text


def _complete(system: str, history: list[ChatTurn], message: str) -> str:
    if not (os.getenv("OPENAI_API_KEY") or "").strip():
        raise HTTPException(status_code=503, detail="Chat is not configured.")
    messages = [{"role": "system", "content": system}]
    for turn in history[-MAX_THREAD_MESSAGES:]:
        role = turn.role if turn.role in {"user", "assistant"} else ""
        content = (turn.content or "").strip()[:MAX_MESSAGE_CHARS]
        if role and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message[:MAX_MESSAGE_CHARS]})
    response = ai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.2,
    )
    return (response.choices[0].message.content or "").strip()


@router.post("/chat")
async def chat(body: ChatRequest, current_user: str = Depends(get_current_user)):
    question = (body.message or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message is required")
    contract_id = (body.contract_id or "").strip() or None
    items = await asyncio.to_thread(_load_contracts, current_user)
    context = _context(items, contract_id)
    system = f"{SYSTEM_PROMPT}\n\nContract facts:\n{context}"
    try:
        reply = await asyncio.to_thread(_complete, system, body.messages, question)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Chat request failed")
        raise HTTPException(status_code=502, detail="Could not answer just now.") from None
    return {"reply": reply or "I could not find an answer in the stored analyses."}
