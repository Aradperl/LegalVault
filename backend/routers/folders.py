import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from config import folders_table
from deps import get_current_user

router = APIRouter(prefix="/folders", tags=["Folders"])


class FolderCreate(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"
    symbol: Optional[str] = "📁"


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    symbol: Optional[str] = None
    contract_ids: Optional[List[str]] = None


@router.get("")
@router.get("/")
async def list_folders(current_user: str = Depends(get_current_user)):
    """List all custom folders for a user."""
    try:
        res = folders_table.query(
            KeyConditionExpression="user_id = :uid",
            ExpressionAttributeValues={":uid": current_user},
        )
        return {"folders": res.get("Items", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
@router.post("/")
async def create_folder(body: FolderCreate, current_user: str = Depends(get_current_user)):
    """Create a new custom folder."""
    folder_id = str(uuid.uuid4())
    item = {
        "user_id": current_user,
        "folder_id": folder_id,
        "name": (body.name or "").strip() or "New folder",
        "color": (body.color or "#6366f1").strip(),
        "symbol": (body.symbol or "📁").strip() or "📁",
        "contract_ids": [],
    }
    try:
        folders_table.put_item(Item=item)
        return {"folder": item}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{folder_id}")
async def update_folder(
    folder_id: str, body: FolderUpdate, current_user: str = Depends(get_current_user)
):
    """Update folder name, color, symbol, or contract list."""
    try:
        existing = folders_table.get_item(
            Key={"user_id": current_user, "folder_id": folder_id}
        )
        item = existing.get("Item")
        if not item:
            raise HTTPException(status_code=404, detail="Folder not found")

        updates = []
        expr_values = {}
        expr_names = {}

        if body.name is not None:
            updates.append("#n = :name")
            expr_values[":name"] = body.name.strip() or item.get("name", "New folder")
            expr_names["#n"] = "name"
        if body.color is not None:
            updates.append("color = :color")
            expr_values[":color"] = body.color.strip()
        if body.symbol is not None:
            updates.append("symbol = :symbol")
            expr_values[":symbol"] = body.symbol.strip() or "📁"
        if body.contract_ids is not None:
            updates.append("contract_ids = :ids")
            expr_values[":ids"] = body.contract_ids

        if not updates:
            return {"folder": item}

        update_expr = "SET " + ", ".join(updates)
        params = {
            "Key": {"user_id": current_user, "folder_id": folder_id},
            "UpdateExpression": update_expr,
            "ExpressionAttributeValues": expr_values,
        }
        if expr_names:
            params["ExpressionAttributeNames"] = expr_names
        folders_table.update_item(**params)
        res = folders_table.get_item(
            Key={"user_id": current_user, "folder_id": folder_id}
        )
        return {"folder": res.get("Item")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str, current_user: str = Depends(get_current_user)
):
    """Delete a custom folder."""
    try:
        folders_table.delete_item(
            Key={"user_id": current_user, "folder_id": folder_id}
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
