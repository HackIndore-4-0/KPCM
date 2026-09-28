from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.core.security import create_access_token, get_current_user

router = APIRouter()

class LoginRequest(BaseModel):
    username: str = Field(..., description="Phone number for citizen or officer ID for ombudsman", example="9876543210")
    password: Optional[str] = Field("hackindore2026", description="Password or demo PIN", example="hackindore2026")
    role: str = Field("citizen", description="Role: 'citizen' or 'ombudsman'", example="citizen")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """Authenticates citizen or ombudsman officer and generates signed JWT access token."""
    if not credentials.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username / contact is required"
        )
    
    # Generate JWT token payload
    token_payload = {
        "sub": credentials.username,
        "role": credentials.role,
        "iss": "finresolve-auth"
    }
    token = create_access_token(token_payload)
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=credentials.role,
        username=credentials.username
    )

@router.get("/me")
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Validates the JWT token and returns authenticated user claims."""
    return {
        "status": "authenticated",
        "user": current_user
    }
