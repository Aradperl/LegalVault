import json
import logging
import os
import uuid
import fitz
from datetime import datetime

logger = logging.getLogger("legalvault")
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from boto3.dynamodb.conditions import Key
from config import s3_client, contracts_table, users_table
from deps import get_current_user
from services.ai_service import call_openai_analysis
from services.calendar_service import (
    _get_calendar_service,
    _parse_expiry,
    create_or_update_reminder_event,
    delete_reminder_event,
)

def _party_from_analysis(analysis):
    if not analysis:
        return "Contract"
    try:
        data = analysis if isinstance(analysis, dict) else json.loads(analysis)
        return (data.get("party") or "Contract").strip() or "Contract"
    except (TypeError, ValueError):
        return "Contract"


router = APIRouter(prefix="/contracts", tags=["Contracts"])


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

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="That PDF is empty.")
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = "".join(page.get_text() for page in doc)
        except Exception:
            raise HTTPException(status_code=400, detail="Could not read that PDF. Try another file.")

        s3_client.put_object(Bucket=bucket, Key=f"{user_id}/{filename}", Body=file_bytes)

        analysis = call_openai_analysis(text)
        contract_id = str(uuid.uuid4())
        reminder_setting = "week"

        # Store analysis as JSON text so DynamoDB never sees floats or empty strings.
        contracts_table.put_item(Item={
            "user_id": user_id,
            "contract_id": contract_id,
            "filename": filename,
            "analysis": json.dumps(analysis),
            "timestamp": datetime.now().isoformat(),
            "reminder_setting": reminder_setting,
        })

        try:
            expiry_date = _parse_expiry(analysis)
            if expiry_date:
                user_res = users_table.get_item(Key={"username": user_id})
                tokens = (user_res.get("Item") or {}).get("google_tokens")
                if tokens:
                    service = _get_calendar_service(tokens)
                    if service:
                        party_name = _party_from_analysis(analysis)
                        event_id, err = create_or_update_reminder_event(
                            service, contract_id, party_name, expiry_date, reminder_setting, None
                        )
                        if event_id:
                            contracts_table.update_item(
                                Key={"user_id": user_id, "contract_id": contract_id},
                                UpdateExpression="SET calendar_event_id = :e",
                                ExpressionAttributeValues={":e": event_id},
                            )
        except Exception as cal_err:
            logger.warning("Calendar reminder skipped: %s", cal_err)

        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Upload failed.")


@router.get("/")
async def get_contracts(current_user: str = Depends(get_current_user)):
    res = contracts_table.query(KeyConditionExpression=Key("user_id").eq(current_user))
    return {"contracts": res.get("Items", [])}


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