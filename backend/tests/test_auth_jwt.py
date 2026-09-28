import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.security import create_access_token, decode_access_token

client = TestClient(app)

def test_create_and_decode_jwt_token():
    payload = {"sub": "9876543210", "role": "citizen"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20
    
    decoded = decode_access_token(token)
    assert decoded["sub"] == "9876543210"
    assert decoded["role"] == "citizen"
    assert "exp" in decoded

def test_login_api_and_me_profile():
    # 1. Login
    res = client.post("/api/v1/auth/login", json={
        "username": "9876543210",
        "role": "citizen"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "citizen"
    
    token = data["access_token"]
    
    # 2. Access /me with bearer token
    res_me = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["status"] == "authenticated"
    assert me_data["user"]["sub"] == "9876543210"
    
    # 3. Access /me without token -> 401
    res_unauth = client.get("/api/v1/auth/me")
    assert res_unauth.status_code == 401
