import json
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from config import CORS_ORIGINS, s3_client, contracts_table, users_table
from models import ReminderUpdate
from deps import get_current_user
from routers import auth, contracts, google_auth, folders
from services.calendar_service import (
    create_or_update_reminder_event,
    delete_reminder_event,
    _get_calendar_service,
    _parse_expiry,
)

app = FastAPI(title="LegalVault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})


@app.middleware("http")
async def security_headers(request, call_next):
    """HSTS only off-localhost so local http://localhost is not broken."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    host = (request.url.hostname or "").lower()
    if host not in _LOCAL_HOSTS:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Register routers
app.include_router(auth.router)
app.include_router(contracts.router)
app.include_router(google_auth.router)
app.include_router(folders.router)


@app.get("/view/{contract_id}/pdf")
async def view_contract_pdf(
    contract_id: str, current_user: str = Depends(get_current_user)
):
    """Stream the PDF from S3 with Content-Disposition: inline so the browser displays it (no download)."""
    user_id = current_user
    res = contracts_table.get_item(Key={"user_id": user_id, "contract_id": contract_id})
    item = res.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Contract not found")
    filename = item.get("filename") or "document.pdf"
    s3_key = f"{user_id}/{filename}"
    bucket = os.getenv("S3_BUCKET_NAME")
    if not bucket:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")
    try:
        obj = s3_client.get_object(Bucket=bucket, Key=s3_key)
        body = obj["Body"].read()
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(
        content=body,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
        },
    )


def _party_from_analysis(analysis):
    """Extract party name from contract analysis for calendar event title."""
    if not analysis:
        return "Contract"
    try:
        data = analysis if isinstance(analysis, dict) else json.loads(analysis)
        return (data.get("party") or "Contract").strip() or "Contract"
    except (TypeError, json.JSONDecodeError):
        return "Contract"


@app.post("/update-reminder")
async def update_reminder(
    body: ReminderUpdate, current_user: str = Depends(get_current_user)
):
    """Update contract reminder and sync to Google Calendar (create/update/delete event)."""
    user_id = current_user
    contract_id = body.contract_id
    setting = (body.reminder_setting or "none").strip().lower()
    if setting not in ("none", "week", "month"):
        raise HTTPException(status_code=400, detail="reminder_setting must be none, week, or month")

    contract_res = contracts_table.get_item(Key={"user_id": user_id, "contract_id": contract_id})
    contract = contract_res.get("Item")
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    user_res = users_table.get_item(Key={"username": user_id})
    user = user_res.get("Item", {})
    tokens = user.get("google_tokens")
    if not tokens and setting != "none":
        raise HTTPException(status_code=400, detail="Connect Google Calendar first to set reminders")

    existing_event_id = contract.get("calendar_event_id")
    service = _get_calendar_service(tokens) if tokens else None

    if setting == "none":
        if existing_event_id and service:
            delete_reminder_event(service, existing_event_id)
        contracts_table.update_item(
            Key={"user_id": user_id, "contract_id": contract_id},
            UpdateExpression="SET reminder_setting = :s REMOVE calendar_event_id",
            ExpressionAttributeValues={":s": "none"},
        )
        return {"status": "success", "reminder_setting": "none"}

    if not service:
        raise HTTPException(status_code=400, detail="Connect Google Calendar first")
    expiry_date = _parse_expiry(contract.get("analysis"))
    if not expiry_date:
        raise HTTPException(status_code=400, detail="Contract has no expiry date; cannot set reminder")
    party_name = _party_from_analysis(contract.get("analysis"))
    event_id, err = create_or_update_reminder_event(
        service, contract_id, party_name, expiry_date, setting, existing_event_id
    )
    if err:
        raise HTTPException(status_code=502, detail=f"Calendar error: {err}")
    contracts_table.update_item(
        Key={"user_id": user_id, "contract_id": contract_id},
        UpdateExpression="SET reminder_setting = :s, calendar_event_id = :e",
        ExpressionAttributeValues={":s": setting, ":e": event_id},
    )
    return {"status": "success", "reminder_setting": setting}


@app.get("/")
async def root():
    return {"status": "online", "version": "2.0.0 (Modular)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)