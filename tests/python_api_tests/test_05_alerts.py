"""
Test Suite: Alerts
==================
Covers:
  - List all alerts
  - List unread-only alerts
  - Mark single alert as read
  - Mark all alerts as read
  - Mark non-existent alert (404)
  - Auth enforcement
  - Response structure
"""

import pytest
import uuid


class TestAlertsList:
    """Scenario: GET /api/alerts — list alerts for the merchant"""

    def test_list_all_alerts(self, auth_client):
        """List all alerts should return 200."""
        resp = auth_client.list_alerts(unread_only=False)
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_list_unread_only(self, auth_client):
        """Filtering by unread_only should still return 200."""
        resp = auth_client.list_alerts(unread_only=True)
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)

    def test_alert_response_structure(self, auth_client):
        """Each alert should contain the AlertDto fields."""
        data = auth_client.list_alerts().json()["data"]
        if data:
            alert = data[0]
            expected = ["id", "merchantId", "transactionId", "severity", "message", "isRead", "createdAt"]
            for field in expected:
                assert field in alert, f"Missing alert field: {field}"

    def test_alert_severity_values(self, auth_client):
        """Alert severity should be one of the known enum values."""
        valid_severities = {"Low", "Medium", "High", "Critical"}
        data = auth_client.list_alerts().json()["data"]
        for alert in data:
            assert alert["severity"] in valid_severities, (
                f"Unknown severity: {alert['severity']}"
            )

    def test_alerts_unauthenticated(self, unauth_client):
        """Alerts without JWT should return 401."""
        resp = unauth_client.list_alerts()
        assert resp.status_code == 401


class TestMarkAlertRead:
    """Scenario: PUT /api/alerts/{id}/read"""

    def test_mark_existing_alert_read(self, auth_client):
        """Marking a valid alert as read should return 200."""
        # Get an alert first
        alerts = auth_client.list_alerts().json()["data"]
        if not alerts:
            pytest.skip("No alerts available to mark as read")

        alert_id = alerts[0]["id"]
        resp = auth_client.mark_alert_read(alert_id)
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True
        assert body["data"] is True

    def test_mark_nonexistent_alert(self, auth_client):
        """Marking a non-existent alert should return 404."""
        fake_id = str(uuid.uuid4())
        resp = auth_client.mark_alert_read(fake_id)
        assert resp.status_code == 404

    def test_mark_alert_unauthenticated(self, unauth_client):
        """Marking alert without JWT should return 401."""
        fake_id = str(uuid.uuid4())
        resp = unauth_client.mark_alert_read(fake_id)
        assert resp.status_code == 401


class TestMarkAllAlertsRead:
    """Scenario: PUT /api/alerts/read-all"""

    def test_mark_all_read(self, auth_client):
        """Marking all alerts as read should return 200."""
        resp = auth_client.mark_all_alerts_read()
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True

    def test_mark_all_read_then_no_unread(self, auth_client):
        """After mark-all-read, unread-only list should be empty."""
        auth_client.mark_all_alerts_read()

        resp = auth_client.list_alerts(unread_only=True)
        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 0

    def test_mark_all_read_unauthenticated(self, unauth_client):
        """Mark-all without JWT should return 401."""
        resp = unauth_client.mark_all_alerts_read()
        assert resp.status_code == 401
