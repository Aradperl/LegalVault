import asyncio
import json
import logging
import os
import uuid
from datetime import datetime
from decimal import Decimal

import fitz
from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder

from config import contracts_table, s3_client, users_table
from deps import get_current_user
from services.ai_service import call_openai_analysis
from services.calendar_service import (
    _get_calendar_service,
    _parse_expiry,
    create_or_update_reminder_event,
    delete_reminder_event,
)

logger = logging.getLogger("legalvault")

router = APIRouter(prefix="/contracts", tags=["Contracts"])


def _party_from_analysis(analysis):
    if not analysis:
        return "Contract"
    try:
        data = analysis if isinstance(analysis, dict) else json.loads(analysis)
        return (data.get("party") or "Contract").strip() or "Contract"
    except (TypeError, ValueError):
        return "Contract"


def _extract_pdf_text(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    return "".join(page.get_text() for page in doc)


def _store_pending(user_id: str, filename: str, file_bytes: bytes, bucket: str) -> str:
    s3_client.put_object(Bucket=bucket, Key=f"{user_id}/{filename}", Body=file_bytes)
    contract_id = str(uuid.uuid4())
    contracts_table.put_item(
        Item={
            "user_id": user_id,
            "contract_id": contract_id,
            "filename": filename,
            "analysis": json.dumps({"status": "analyzing"}),
            "timestamp": datetime.now().isoformat(),
            "reminder_setting": "week",
        }
    )
    return contract_id


def _write_analysis(user_id: str, contract_id: str, payload: dict) -> None:
    contracts_table.update_item(
        Key={"user_id": user_id, "contract_id": contract_id},
        UpdateExpression="SET analysis = :a",
        ExpressionAttributeValues={":a": json.dumps(payload, default=str)},
    )


async def _finish_analysis(user_id: str, contract_id: str, file_bytes: bytes) -> None:
    try:
        try:
            text = await asyncio.to_thread(_extract_pdf_text, file_bytes)
        except Exception:
            await asyncio.to_thread(
                _write_analysis,
                user_id,
                contract_id,
                {"status": "error", "error": "Could not read that PDF. Try another file."},
            )
            return
        analysis = await asyncio.to_thread(call_openai_analysis, text)
        await asyncio.to_thread(_write_analysis, user_id, contract_id, analysis)
        try:
            await asyncio.to_thread(_maybe_add_calendar, user_id, contract_id, analysis)
        except Exception as cal_err:
            logger.warning("Calendar reminder skipped: %s", cal_err)
    except Exception as exc:
        logger.exception("Background analysis failed")
        await asyncio.to_thread(
            _write_analysis,
            user_id,
            contract_id,
            {"status": "error", "error": str(exc) or "Analysis failed."},
        )


def _maybe_add_calendar(user_id: str, contract_id: str, analysis: dict) -> None:
    expiry_date = _parse_expiry(analysis)
    if not expiry_date:
        return
    user_res = users_table.get_item(Key={"username": user_id})
    tokens = (user_res.get("Item") or {}).get("google_tokens")
    if not tokens:
        return
    service = _get_calendar_service(tokens)
    if not service:
        return
    party_name = _party_from_analysis(analysis)
    event_id, _err = create_or_update_reminder_event(
        service, contract_id, party_name, expiry_date, "week", None
    )
    if event_id:
        contracts_table.update_item(
            Key={"user_id": user_id, "contract_id": contract_id},
            UpdateExpression="SET calendar_event_id = :e",
            ExpressionAttributeValues={":e": event_id},
        )


@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    user_id = current_user
    filename = (file.filename or "contract.pdf").strip() or "contract.pdf"
    bucket = (os.getenv("S3_BUCKET_NAME") or "").strip()
    if not bucket:
        raise HTTPException(status_code=500, detail="S3 bucket is not configured.")
    if not (os.getenv("OPENAI_API_KEY") or "").strip():
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="That PDF is empty.")

    try:
        contract_id = await asyncio.to_thread(_store_pending, user_id, filename, file_bytes, bucket)
    except Exception as e:
        logger.exception("Contract upload failed")
        raise HTTPException(status_code=500, detail=str(e) or "Upload failed.") from e

    asyncio.create_task(_finish_analysis(user_id, contract_id, file_bytes))
    return {"status": "pending", "contract_id": contract_id}


@router.get("/")
async def get_contracts(current_user: str = Depends(get_current_user)):
    res = contracts_table.query(KeyConditionExpression=Key("user_id").eq(current_user))
    items = res.get("Items", [])
    return {"contracts": jsonable_encoder(items, custom_encoder={Decimal: float})}


@router.get("/{contract_id}")
async def get_contract(contract_id: str, current_user: str = Depends(get_current_user)):
    res = contracts_table.get_item(Key={"user_id": current_user, "contract_id": contract_id})
    item = res.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"contract": jsonable_encoder(item, custom_encoder={Decimal: float})}


@router.delete("/{contract_id}")
async def delete_contract(contract_id: str, current_user: str = Depends(get_current_user)):
    user_id = current_user
    res = contracts_table.get_item(Key={"user_id": user_id, "contract_id": contract_id})
    item = res.get("Item")
    if item:
        event_id = item.get("calendar_event_id")
        if event_id:
            user_res = users_table.get_item(Key={"username": user_id})
            tokens = (user_res.get("Item") or {}).get("google_tokens")
            if tokens:
                service = _get_calendar_service(tokens)
                if service:
                    delete_reminder_event(service, event_id)
    contracts_table.delete_item(Key={"user_id": user_id, "contract_id": contract_id})
    return {"status": "success"}
