import json
import os

from config import ai_client


def call_openai_analysis(text_content):
    if not (os.getenv("OPENAI_API_KEY") or "").strip():
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    prompt_instruction = """
    You are an expert legal assistant. Analyze the contract and return a JSON object with:
    1. "subject": A short title (3-5 words).
    2. "party": The other party's name (company or person).
    3. "expiry_date": ISO date (YYYY-MM-DD) or "N/A".
    4. "conclusion": One short sentence (max 25 words) that sums up what the contract is and its main outcome or purpose.
    5. "summary": A concise, scannable Markdown summary for the full insights view (key points, obligations, risks, bottom line).
    6. "annual_value": Estimated total annual cost/liability in USD (number only). Use 0 if not a monetary contract or unknown.
    7. "has_auto_renewal": true if the contract has automatic renewal clause, false otherwise.
    8. "notice_period_days": Number of days required for termination notice (e.g. 30, 60, 90). Use 0 if not specified.
    9. "risk_flags": Array of strings for red flags present. Use exactly these keys when applicable: "auto_renewal", "exit_penalty", "non_compete", "long_commitment", "price_increase". Add a short "risk_flags_note" string (one line) explaining in plain language what the main risk is, e.g. "Auto-renews annually unless 60 days notice given." Use empty array [] and empty string for note if none.
    10. "is_signed": CRITICAL - set true ONLY if the contract is clearly EXECUTED. Check: (a) Is there a specific date when the agreement was signed or executed (e.g. "Signed: 15 January 2024", "Executed as of 2024-01-15", "Date of execution:")? (b) Do signature blocks appear FILLED (actual names or dates, not blank lines or underscores)? If BOTH (a) and (b) are clearly present, set true. If the signature area has blank lines, underscores, "By:_______________", no signed date, or you cannot confirm both parties signed with a date, set false. When in any doubt, set false.
    """
    response = ai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompt_instruction},
            {"role": "user", "content": f"Analyze this contract. Pay special attention to the end of the document (signature section) to decide if it is signed/executed or still unsigned.\n\n{text_content[:6000]}"}
        ],
        response_format={"type": "json_object"}
    )
    data = json.loads(response.choices[0].message.content)
    text_lower = (text_content or "")[:6000].lower()

    # Normalize is_signed from AI (might be string or wrong type)
    if "is_signed" in data:
        val = data["is_signed"]
        if isinstance(val, bool):
            data["is_signed"] = val
        elif isinstance(val, str):
            data["is_signed"] = val.lower().strip() in ("true", "yes", "1", "signed", "executed")
        else:
            data["is_signed"] = bool(val)
    else:
        data["is_signed"] = False  # missing = treat as unsigned

    # Override: if AI said true but the document text has NO execution wording anywhere, force false.
    # (Unsigned contracts typically have no "signed on" / "executed as of" etc. in the extracted text.)
    executed_phrases = [
        "signed on", "signed:", "executed on", "executed as of", "date of execution",
        "executed this", "executed by", "date signed", "execution date", "executed:"
    ]
    has_execution_in_text = any(p in text_lower for p in executed_phrases)
    if data["is_signed"] is True and not has_execution_in_text:
        data["is_signed"] = False

    data["is_signed"] = bool(data["is_signed"])
    return data