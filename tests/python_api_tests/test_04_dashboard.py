"""
Test Suite: Dashboard Endpoints
===============================
Covers:
  - GET /api/dashboard/stats
  - GET /api/dashboard/trends
  - GET /api/dashboard/recent
  - Auth enforcement on all dashboard endpoints
  - Response structure validation
"""

import pytest


class TestDashboardStats:
    """Scenario: GET /api/dashboard/stats — merchant statistics"""

    def test_stats_returns_200(self, auth_client):
        """Authenticated request should return 200."""
        resp = auth_client.get_dashboard_stats()
        assert resp.status_code == 200

    def test_stats_response_structure(self, auth_client):
        """Stats response should contain all expected fields."""
        body = auth_client.get_dashboard_stats().json()
        assert body["success"] is True

        data = body["data"]
        expected_fields = [
            "transactionsToday",
            "flaggedToday",
            "blockedToday",
            "unreadAlerts",
            "approvalRate",
            "avgFraudProbability",
            "totalVolumeToday",
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"

    def test_stats_numeric_values(self, auth_client):
        """All stats values should be numeric (int or float)."""
        data = auth_client.get_dashboard_stats().json()["data"]
        assert isinstance(data["transactionsToday"], int)
        assert isinstance(data["flaggedToday"], int)
        assert isinstance(data["blockedToday"], int)
        assert isinstance(data["unreadAlerts"], int)
        assert isinstance(data["approvalRate"], (int, float))
        assert isinstance(data["avgFraudProbability"], (int, float))
        assert isinstance(data["totalVolumeToday"], (int, float))

    def test_stats_unauthenticated(self, unauth_client):
        """Dashboard stats without JWT should return 401."""
        resp = unauth_client.get_dashboard_stats()
        assert resp.status_code == 401


class TestDashboardTrends:
    """Scenario: GET /api/dashboard/trends — fraud trends over time"""

    def test_trends_default_7_days(self, auth_client):
        """Default trends request (7 days) should return 200."""
        resp = auth_client.get_fraud_trends()
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_trends_custom_days(self, auth_client):
        """Custom days parameter should be accepted."""
        resp = auth_client.get_fraud_trends(days=30)
        assert resp.status_code == 200

    def test_trends_response_structure(self, auth_client):
        """Each trend entry should have date, approved, review, blocked."""
        data = auth_client.get_fraud_trends(days=7).json()["data"]
        if data:  # May be empty if no data
            entry = data[0]
            assert "date" in entry
            assert "approved" in entry
            assert "review" in entry
            assert "blocked" in entry

    def test_trends_unauthenticated(self, unauth_client):
        """Trends without JWT should return 401."""
        resp = unauth_client.get_fraud_trends()
        assert resp.status_code == 401


class TestDashboardRecent:
    """Scenario: GET /api/dashboard/recent — recent transaction feed"""

    def test_recent_default(self, auth_client):
        """Default recent request should return 200."""
        resp = auth_client.get_recent_transactions()
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_recent_custom_count(self, auth_client):
        """Custom count parameter should limit results."""
        resp = auth_client.get_recent_transactions(count=3)
        assert resp.status_code == 200

        data = resp.json()["data"]
        assert len(data) <= 3

    def test_recent_transaction_structure(self, auth_client):
        """Each recent transaction should match TransactionResponseDto."""
        data = auth_client.get_recent_transactions(count=1).json()["data"]
        if data:
            tx = data[0]
            assert "id" in tx
            assert "merchantId" in tx
            assert "customerId" in tx
            assert "amount" in tx
            assert "currency" in tx
            assert "country" in tx
            assert "mcc" in tx
            assert "status" in tx
            assert "createdAt" in tx

    def test_recent_unauthenticated(self, unauth_client):
        """Recent transactions without JWT should return 401."""
        resp = unauth_client.get_recent_transactions()
        assert resp.status_code == 401
