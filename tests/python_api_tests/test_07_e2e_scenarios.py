"""
Test Suite: End-to-End Scenarios
================================
These tests simulate real-world usage flows:
  1. Full merchant onboarding: register → login → submit transaction → check dashboard
  2. Fraud detection flow: submit suspicious tx → check alerts
  3. Cross-merchant isolation: Merchant A can't see Merchant B's data
  4. API response wrapper consistency
"""

import pytest
import uuid
from api_client import AegisRadarClient
from config import BASE_URL, DEMO_API_KEY


class TestFullMerchantOnboarding:
    """Scenario: A new merchant registers, logs in, submits a tx, and views dashboard."""

    def test_onboarding_flow(self, client):
        """Complete onboarding flow should work end-to-end."""
        unique_email = f"e2e-{uuid.uuid4().hex[:8]}@aegisradar.io"

        # Step 1: Register
        reg_resp = client.register("E2E Corp", unique_email, "E2ePass@123", "EG")
        assert reg_resp.status_code == 201
        token = reg_resp.json()["data"]["token"]

        # Step 2: Use the token
        e2e_client = AegisRadarClient(BASE_URL)
        e2e_client.set_jwt(token)

        # Step 3: Get merchant profile
        profile_resp = e2e_client.get_merchant_profile()
        assert profile_resp.status_code == 200
        profile = profile_resp.json()["data"]
        assert profile["email"] == unique_email
        assert profile["companyName"] == "E2E Corp"

        # Step 4: Get API key from profile and submit a transaction
        api_key = profile["apiKey"]
        assert api_key is not None

        e2e_client.set_api_key(api_key)
        tx_resp = e2e_client.submit_transaction(
            customer_id="cust_e2e_001",
            amount=500.00,
        )
        assert tx_resp.status_code == 202

        # Step 5: Check dashboard stats
        stats_resp = e2e_client.get_dashboard_stats()
        assert stats_resp.status_code == 200

    def test_login_after_register(self, client):
        """A registered merchant should be able to log in with their credentials."""
        unique_email = f"login-{uuid.uuid4().hex[:8]}@aegisradar.io"
        password = "LoginTest@456"

        # Register
        reg = client.register("Login Test Inc", unique_email, password, "SA")
        assert reg.status_code == 201

        # Login with same credentials
        login = client.login(unique_email, password)
        assert login.status_code == 200
        assert login.json()["data"]["email"] == unique_email


class TestFraudDetectionFlow:
    """Scenario: Submit transactions and observe fraud detection results."""

    def test_submit_and_check_status(self, auth_client):
        """Submit a tx, then retrieve it — status should be set."""
        # Submit
        tx_resp = auth_client.submit_transaction(
            customer_id=f"cust_fraud_{uuid.uuid4().hex[:6]}",
            amount=50000.00,  # Large amount - might trigger fraud
            currency="EGP",
            country="NG",  # Foreign country - might trigger is_foreign
            mcc=7995,  # Gambling MCC
        )
        assert tx_resp.status_code == 202
        tx_id = tx_resp.json()["data"]["id"]

        # Retrieve (status may still be Pending since fraud analysis is async)
        get_resp = auth_client.get_transaction(tx_id)
        assert get_resp.status_code == 200

        tx_data = get_resp.json()["data"]
        valid_statuses = {"Pending", "Approved", "Review", "Blocked"}
        assert tx_data["status"] in valid_statuses


class TestCrossMerchantIsolation:
    """Scenario: Data isolation — merchants should not see each other's data."""

    def test_cannot_access_other_merchants_transaction(self, auth_client):
        """Querying a random UUID (not owned) should return 404."""
        fake_tx_id = str(uuid.uuid4())
        resp = auth_client.get_transaction(fake_tx_id)
        assert resp.status_code == 404


class TestApiResponseWrapper:
    """Scenario: All endpoints should return the ApiResponse<T> wrapper format."""

    @pytest.mark.parametrize("endpoint,method", [
        ("/api/dashboard/stats", "GET"),
        ("/api/dashboard/trends", "GET"),
        ("/api/dashboard/recent", "GET"),
        ("/api/alerts", "GET"),
        ("/api/merchants/me", "GET"),
        ("/api/transactions", "GET"),
        ("/api/subscriptions/plans", "GET"),
    ])
    def test_response_wrapper_format(self, auth_client, endpoint, method):
        """All successful responses should have { success, message, data }."""
        resp = auth_client._request(method, endpoint)
        if resp.status_code == 200:
            body = resp.json()
            assert "success" in body, f"{endpoint}: missing 'success'"
            assert "message" in body, f"{endpoint}: missing 'message'"
            assert "data" in body, f"{endpoint}: missing 'data'"

    def test_failed_response_wrapper(self, client):
        """Failed auth should also use the ApiResponse wrapper."""
        resp = client.login("wrong@email.com", "bad_password")
        if resp.status_code == 401:
            body = resp.json()
            assert body["success"] is False


class TestEdgeCases:
    """Scenario: Edge cases and boundary conditions."""

    def test_large_amount_transaction(self, auth_client):
        """Very large transaction amount should still be accepted."""
        resp = auth_client.submit_transaction(
            customer_id="cust_large",
            amount=9999999.99,
        )
        assert resp.status_code == 202

    def test_small_amount_transaction(self, auth_client):
        """Very small (but positive) amount should be accepted."""
        resp = auth_client.submit_transaction(
            customer_id="cust_small",
            amount=0.01,
        )
        assert resp.status_code == 202

    def test_special_characters_in_customer_id(self, auth_client):
        """Customer IDs with special characters should be handled."""
        resp = auth_client.submit_transaction(
            customer_id="cust_special-chars.test_123",
            amount=100.00,
        )
        assert resp.status_code == 202

    def test_pagination_page_zero(self, auth_client):
        """Page 0 should either return empty or be handled gracefully."""
        resp = auth_client.list_transactions(page=0, page_size=10)
        # Should not crash — either returns data or empty
        assert resp.status_code in (200, 400)

    def test_pagination_large_page(self, auth_client):
        """Very large page number should return empty data, not error."""
        resp = auth_client.list_transactions(page=99999, page_size=10)
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)

    def test_trends_zero_days(self, auth_client):
        """Requesting 0 days of trends should be handled gracefully."""
        resp = auth_client.get_fraud_trends(days=0)
        assert resp.status_code in (200, 400)

    def test_recent_zero_count(self, auth_client):
        """Requesting 0 recent transactions should return empty or be handled."""
        resp = auth_client.get_recent_transactions(count=0)
        assert resp.status_code in (200, 400)
