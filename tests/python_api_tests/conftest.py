"""
AegisRadar — Shared Pytest Fixtures
=====================================
Provides authenticated clients, demo data, and helper utilities
shared across all test modules.
"""

import pytest
import uuid
import sys
import os

# Ensure the test package is importable
sys.path.insert(0, os.path.dirname(__file__))

from api_client import AegisRadarClient
from config import (
    BASE_URL,
    DEMO_EMAIL,
    DEMO_PASSWORD,
    DEMO_API_KEY,
    TEST_COMPANY,
    TEST_EMAIL,
    TEST_PASSWORD,
    TEST_COUNTRY,
)


# ═══════════════════════════════════════════════════════════════════════════════
# FIXTURES
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.fixture(scope="session")
def client() -> AegisRadarClient:
    """Plain (unauthenticated) API client."""
    return AegisRadarClient(BASE_URL)


@pytest.fixture(scope="session")
def demo_jwt(client: AegisRadarClient) -> str:
    """Login with the seeded demo merchant and return the JWT token."""
    resp = client.login(DEMO_EMAIL, DEMO_PASSWORD)
    assert resp.status_code == 200, f"Demo login failed: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    return data["data"]["token"]


@pytest.fixture(scope="session")
def auth_client(demo_jwt: str) -> AegisRadarClient:
    """Fully authenticated client (JWT + API Key) for the demo merchant."""
    c = AegisRadarClient(BASE_URL)
    c.set_jwt(demo_jwt)
    c.set_api_key(DEMO_API_KEY)
    return c


@pytest.fixture
def unauth_client() -> AegisRadarClient:
    """Fresh unauthenticated client (no JWT, no API key)."""
    return AegisRadarClient(BASE_URL)


@pytest.fixture
def random_email() -> str:
    """Generate a unique email for registration tests."""
    return f"test-{uuid.uuid4().hex[:8]}@aegisradar.io"


@pytest.fixture
def random_customer_id() -> str:
    """Generate a unique customer ID for transaction tests."""
    return f"cust_{uuid.uuid4().hex[:12]}"
