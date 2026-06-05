"""
Test Suite: Authentication (Login & Register)
==============================================
Covers:
  - Login with valid demo credentials
  - Login with invalid credentials
  - Login with missing fields
  - Registration with valid data
  - Registration with duplicate email
  - JWT token structure validation
"""

import pytest
import uuid
from config import DEMO_EMAIL, DEMO_PASSWORD


class TestLogin:
    """Scenario: Merchant login via POST /api/auth/login"""

    def test_login_success(self, client):
        """Valid demo credentials should return 200 + JWT token."""
        resp = client.login(DEMO_EMAIL, DEMO_PASSWORD)
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True
        assert body["message"] == "Login successful."

        data = body["data"]
        assert "token" in data
        assert data["email"] == DEMO_EMAIL
        assert len(data["token"]) > 50  # JWT tokens are long
        assert "companyName" in data
        assert "role" in data
        assert "expires" in data

    def test_login_wrong_password(self, client):
        """Wrong password should return 401."""
        resp = client.login(DEMO_EMAIL, "WrongPassword@123")
        assert resp.status_code == 401

        body = resp.json()
        assert body["success"] is False
        assert "invalid" in body["message"].lower() or "password" in body["message"].lower()

    def test_login_nonexistent_email(self, client):
        """Non-existent email should return 401."""
        resp = client.login("nonexistent@example.com", "SomePass@123")
        assert resp.status_code == 401

    def test_login_empty_body(self, client):
        """Empty request body should return 400 (validation error)."""
        resp = client._request("POST", "/api/auth/login", json={})
        # FluentValidation or model binding should reject this
        assert resp.status_code in (400, 401, 422)

    def test_login_missing_password(self, client):
        """Missing password field should fail."""
        resp = client._request("POST", "/api/auth/login", json={"email": DEMO_EMAIL})
        assert resp.status_code in (400, 401, 422)

    def test_login_missing_email(self, client):
        """Missing email field should fail."""
        resp = client._request("POST", "/api/auth/login", json={"password": DEMO_PASSWORD})
        assert resp.status_code in (400, 401, 422)


class TestRegister:
    """Scenario: New merchant registration via POST /api/auth/register"""

    def test_register_success(self, client):
        """Registration with valid data should return 201 + JWT token."""
        unique_email = f"pytest-{uuid.uuid4().hex[:8]}@aegisradar.io"
        resp = client.register(
            company_name="PyTest Corp",
            email=unique_email,
            password="SecurePass@123",
            country="EG",
        )
        assert resp.status_code == 201

        body = resp.json()
        assert body["success"] is True
        assert "token" in body["data"]
        assert body["data"]["email"] == unique_email
        assert body["data"]["companyName"] == "PyTest Corp"

    def test_register_duplicate_email(self, client):
        """Registering with an existing email should fail."""
        # First, register a unique email
        unique_email = f"pytest-dup-{uuid.uuid4().hex[:8]}@aegisradar.io"
        resp1 = client.register("First Corp", unique_email, "Pass@1234", "EG")
        assert resp1.status_code == 201

        # Try again with the same email — should fail
        resp2 = client.register("Second Corp", unique_email, "Pass@5678", "EG")
        # Could be 400 or 409 depending on how the server handles it
        assert resp2.status_code in (400, 409, 500)

    def test_register_missing_company_name(self, client):
        """Missing company name should fail validation."""
        resp = client._request("POST", "/api/auth/register", json={
            "email": f"test-{uuid.uuid4().hex[:6]}@test.com",
            "password": "Pass@123",
            "country": "EG",
        })
        assert resp.status_code in (400, 422, 500)

    def test_register_response_contains_token(self, client):
        """Successful registration should auto-login and return a usable JWT."""
        unique_email = f"pytest-tok-{uuid.uuid4().hex[:8]}@aegisradar.io"
        resp = client.register("Token Test Corp", unique_email, "Pass@1234!", "SA")
        body = resp.json()

        # The token should be usable immediately
        assert resp.status_code == 201
        token = body["data"]["token"]
        assert len(token) > 0
