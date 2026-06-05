"""
Test Suite: Health Check
========================
Verifies the /health endpoint is reachable and returns the expected payload.
"""

import pytest


class TestHealthCheck:
    """Scenario: The API health endpoint should always be publicly accessible."""

    def test_health_returns_200(self, client):
        """GET /health → 200 with status=healthy"""
        resp = client.health_check()
        assert resp.status_code == 200

    def test_health_response_body(self, client):
        """Health response contains required fields."""
        data = client.health_check().json()
        assert data["status"] == "healthy"
        assert data["service"] == "AegisRadar API"
        assert "timestamp" in data

    def test_health_no_auth_required(self, unauth_client):
        """Health check should NOT require authentication."""
        resp = unauth_client.health_check()
        assert resp.status_code == 200
