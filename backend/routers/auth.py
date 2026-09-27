import logging
import re

from fastapi import APIRouter, Depends, Form, HTTPException

from config import users_table
from deps import get_current_user
from services.auth_service import get_password_hash, verify_password, create_access_token

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


@router.post("/signup")
async def signup(username: str = Form(...), password: str = Form(...), email: str = Form(...)):
    username = _validate_username(username)
    email = _validate_email(email)
    _validate_password(password, username)

    if "Item" in users_table.get_item(Key={"username": username}):
        raise HTTPException(status_code=400, detail="User exists")

    users_table.put_item(
        Item={
            "username": username,
            "password": get_password_hash(password),
            "email": email,
        }
    )
    return {
        "status": "success",
        "message": "Account created. You can now sign in.",
    }


@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    username = (username or "").strip()
    res = users_table.get_item(Key={"username": username})
    if "Item" not in res or not verify_password(password, res["Item"]["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": username,
    }


@router.get("/check-google-connection")
async def check_google_connection(current_user: str = Depends(get_current_user)):
    res = users_table.get_item(Key={"username": current_user})
    item = res.get("Item", {})
    return {"connected": "google_tokens" in item, "picture_url": item.get("picture_url")}
