import hashlib
import hmac
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse

from config import AUTO_VERIFY_EMAIL, ENVIRONMENT, users_table
from deps import get_current_user
from services.auth_service import get_password_hash, verify_password, create_access_token
from services.email_service import send_verification_email

logger = logging.getLogger("legalvault")

router = APIRouter(tags=["Authentication"])

USERNAME_RE = re.compile(r"^[A-Za-z0-9_-]{3,64}$")
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")
COMMON_PASSWORDS = frozenset(
    {
        "password",
        "password1",
        "password12",
        "password123",
        "12345678",
        "123456789",
        "1234567890",
        "qwerty",
        "qwerty123",
        "letmein",
        "welcome",
        "admin",
        "iloveyou",
        "monkey",
        "dragon",
        "abc123",
        "passw0rd",
        "11111111",
        "00000000",
    }
)
VERIFY_TOKEN_HOURS = 48


def _validate_username(username: str) -> str:
    username = (username or "").strip()
    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 3 characters.",
        )
    if len(username) > 64:
        raise HTTPException(
            status_code=400,
            detail="Username must be at most 64 characters.",
        )
    if not USERNAME_RE.fullmatch(username):
        raise HTTPException(
            status_code=400,
            detail="Username may only contain letters, numbers, underscores, and hyphens.",
        )
    return username


def _validate_email(email: str) -> str:
    email = (email or "").strip()
    if not EMAIL_RE.fullmatch(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    return email


def _validate_password(password: str, username: str) -> None:
    if len(password or "") < 10:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 10 characters.",
        )
    if not re.search(r"[A-Za-z]", password) or not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must include at least one letter and one number.",
        )
    lowered = password.lower()
    if lowered in COMMON_PASSWORDS or lowered == username.lower():
        raise HTTPException(
            status_code=400,
            detail="That password is too common. Choose something less obvious.",
        )


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_verify_token(username: str) -> tuple[str, str, str]:
    token = f"{username}.{secrets.token_urlsafe(32)}"
    expires = (datetime.now(timezone.utc) + timedelta(hours=VERIFY_TOKEN_HOURS)).isoformat()
    return token, _hash_token(token), expires


def _is_verified(user: dict) -> bool:
    """Legacy accounts with no verified flag stay usable."""
    if "verified" not in user:
        return True
    return bool(user.get("verified"))


@router.post("/signup")
async def signup(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...),
):
    username = _validate_username(username)
    email = _validate_email(email)
    _validate_password(password, username)

    if "Item" in users_table.get_item(Key={"username": username}):
        raise HTTPException(status_code=400, detail="User exists")

    item = {
        "username": username,
        "password": get_password_hash(password),
        "email": email,
        "verified": bool(AUTO_VERIFY_EMAIL),
    }
    sent = False
    if not AUTO_VERIFY_EMAIL:
        token, token_hash, expires = _new_verify_token(username)
        item["email_verify_token_hash"] = token_hash
        item["email_verify_expires"] = expires
        verify_url = str(request.base_url).rstrip("/") + f"/verify-email?token={token}"
        sent = send_verification_email(email, verify_url)
        if ENVIRONMENT != "production":
            logger.info("Email verify URL: %s", verify_url)

    users_table.put_item(Item=item)

    if AUTO_VERIFY_EMAIL:
        message = "Account created. You can now sign in."
    elif sent:
        message = "Account created. Check your email for a verification link before signing in."
    else:
        message = (
            "Account created, but the verification email could not be sent. "
            "Set SES_FROM_EMAIL and verify that address in Amazon SES."
        )
    return {"status": "success", "message": message, "verified": bool(AUTO_VERIFY_EMAIL)}


@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    username = (username or "").strip()
    res = users_table.get_item(Key={"username": username})
    if "Item" not in res or not verify_password(password, res["Item"]["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not _is_verified(res["Item"]):
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Use the verify-email link, or set AUTO_VERIFY_EMAIL=true for local/dev.",
        )
    access_token = create_access_token(data={"sub": username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": username,
    }


@router.get("/verify-email")
async def verify_email(token: str = ""):
    if not token or "." not in token:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    username, _secret = token.split(".", 1)
    res = users_table.get_item(Key={"username": username})
    user = res.get("Item")
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    if _is_verified(user) and "verified" in user:
        return HTMLResponse("<p>Email already verified. You can sign in to LegalVault.</p>")

    stored = user.get("email_verify_token_hash") or ""
    computed = _hash_token(token)
    try:
        token_ok = bool(stored) and hmac.compare_digest(stored, computed)
    except (TypeError, ValueError):
        token_ok = False
    if not token_ok:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    expires_raw = user.get("email_verify_expires")
    try:
        expires = datetime.fromisoformat(expires_raw)
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    users_table.update_item(
        Key={"username": username},
        UpdateExpression="SET verified = :v REMOVE email_verify_token_hash, email_verify_expires",
        ExpressionAttributeValues={":v": True},
    )
    return HTMLResponse("<p>Email verified. You can sign in to LegalVault.</p>")


@router.get("/check-google-connection")
async def check_google_connection(current_user: str = Depends(get_current_user)):
    res = users_table.get_item(Key={"username": current_user})
    item = res.get("Item", {})
    return {"connected": "google_tokens" in item, "picture_url": item.get("picture_url")}
