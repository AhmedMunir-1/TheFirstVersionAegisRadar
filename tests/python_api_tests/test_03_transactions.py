"""
Test Suite: Transaction Submission & Retrieval
==============================================
Covers:
  - Submit transaction with valid API key
  - Submit without API key (401)
  - Submit with invalid API key (401)
  - Validation: missing fields, invalid amount, bad currency/country codes
  - List transactions (paginated)
  - Get transaction by ID
  - Get non-existent transaction (404)
"""

import pytest
import uuid
from config import DEMO_API_KEY


class TestTransactionSubmission:
    """Scenario: POST /api/transactions — requires X-API-Key header"""

    def test_submit_valid_transaction(self, auth_client, random_customer_id):
        """Valid transaction with API key should return 202 Accepted."""
        resp = auth_client.submit_transaction(
            customer_id=random_customer_id,
            amount=1500.00,
            currency="EGP",
            country="EG",
            mcc=5411,
            device_id="dev_pytest",
            ip_address="197.1.2.3",
        )
        assert resp.status_code == 202

        body = resp.json()
        assert body["success"] is True
        assert "accepted" in body["message"].lower()

        data = body["data"]
        assert data["customerId"] == random_customer_id
        assert data["amount"] == 1500.0
        assert data["currency"] == "EGP"
        assert data["country"] == "EG"
        assert data["mcc"] == 5411
        assert "id" in data

    def test_submit_without_api_key(self, unauth_client):
        """Missing X-API-Key header should return 401."""
        resp = unauth_client.submit_transaction(
            customer_id="cust_no_key",
            amount=100.00,
        )
        assert resp.status_code == 401

    def test_submit_with_invalid_api_key(self, client):
        """Invalid API key should return 401."""
        resp = client.submit_transaction(
            customer_id="cust_bad_key",
            amount=100.00,
            api_key="ar_invalid_key_12345",
        )
        assert resp.status_code == 401

    def test_submit_multiple_transactions(self, auth_client):
        """Submitting multiple transactions should all succeed."""
        for i in range(3):
            resp = auth_client.submit_transaction(
                customer_id=f"cust_batch_{uuid.uuid4().hex[:8]}",
                amount=100.0 * (i + 1),
            )
            assert resp.status_code == 202


class TestTransactionValidation:
    """Scenario: FluentValidation rules on TransactionRequestDto"""

    def test_zero_amount_rejected(self, auth_client):
        """Amount of 0 should fail validation (must be > 0)."""
        resp = auth_client.submit_transaction(
            customer_id="cust_zero",
            amount=0,
        )
        assert resp.status_code == 400

    def test_negative_amount_rejected(self, auth_client):
        """Negative amount should fail validation."""
        resp = auth_client.submit_transaction(
            customer_id="cust_neg",
            amount=-500.00,
        )
        assert resp.status_code == 400

    def test_empty_customer_id_rejected(self, auth_client):
        """Empty customerId should fail validation."""
        resp = auth_client.submit_transaction(
            customer_id="",
            amount=100.00,
        )
        assert resp.status_code == 400

    def test_invalid_currency_code(self, auth_client):
        """Currency that is not 3 characters should fail."""
        resp = auth_client.submit_transaction(
            customer_id="cust_cur",
            amount=100.00,
            currency="EGPT",  # 4 chars, should fail
        )
        assert resp.status_code == 400

    def test_invalid_country_code(self, auth_client):
        """Country that is not 2 characters should fail."""
        resp = auth_client.submit_transaction(
            customer_id="cust_cty",
            amount=100.00,
            country="EGY",  # 3 chars, should fail
        )
        assert resp.status_code == 400

    def test_mcc_out_of_range_zero(self, auth_client):
        """MCC = 0 should fail (must be 1-9999)."""
        resp = auth_client.submit_transaction(
            customer_id="cust_mcc",
            amount=100.00,
            mcc=0,
        )
        assert resp.status_code == 400

    def test_mcc_out_of_range_high(self, auth_client):
        """MCC = 10000 should fail (must be 1-9999)."""
        resp = auth_client.submit_transaction(
            customer_id="cust_mcc_hi",
            amount=100.00,
            mcc=10000,
        )
        assert resp.status_code == 400

    def test_missing_device_id(self, auth_client):
        """Empty deviceId should fail validation."""
        resp = auth_client._request("POST", "/api/transactions", json={
            "customerId": "cust_dev",
            "amount": 100.00,
            "currency": "EGP",
            "country": "EG",
            "mcc": 5411,
            "deviceId": "",
            "ipAddress": "1.2.3.4",
        }, extra_headers={"X-API-Key": DEMO_API_KEY})
        assert resp.status_code == 400

    def test_missing_ip_address(self, auth_client):
        """Empty ipAddress should fail validation."""
        resp = auth_client._request("POST", "/api/transactions", json={
            "customerId": "cust_ip",
            "amount": 100.00,
            "currency": "EGP",
            "country": "EG",
            "mcc": 5411,
            "deviceId": "dev_test",
            "ipAddress": "",
        }, extra_headers={"X-API-Key": DEMO_API_KEY})
        assert resp.status_code == 400


class TestTransactionRetrieval:
    """Scenario: GET /api/transactions — requires JWT auth"""

    def test_list_transactions(self, auth_client):
        """Listing transactions should return 200 with an array."""
        resp = auth_client.list_transactions()
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_list_transactions_pagination(self, auth_client):
        """Pagination params should be respected."""
        resp = auth_client.list_transactions(page=1, page_size=5)
        assert resp.status_code == 200

        data = resp.json()["data"]
        assert len(data) <= 5

    def test_list_transactions_unauthenticated(self, unauth_client):
        """Listing transactions without JWT should return 401."""
        resp = unauth_client.list_transactions()
        assert resp.status_code == 401

    def test_get_transaction_by_id(self, auth_client):
        """GET a known transaction from the seeded data."""
        # First, list to get an actual ID
        list_resp = auth_client.list_transactions(page=1, page_size=1)
        if list_resp.status_code == 200 and list_resp.json()["data"]:
            tx_id = list_resp.json()["data"][0]["id"]
            resp = auth_client.get_transaction(tx_id)
            assert resp.status_code == 200
            assert resp.json()["data"]["id"] == tx_id
        else:
            pytest.skip("No transactions available to test get-by-id")

    def test_get_nonexistent_transaction(self, auth_client):
        """GET with a random GUID should return 404."""
        fake_id = str(uuid.uuid4())
        resp = auth_client.get_transaction(fake_id)
        assert resp.status_code == 404

    def test_get_transaction_invalid_guid(self, auth_client):
        """GET with a non-GUID ID should return 404 or 400."""
        resp = auth_client.get_transaction("not-a-valid-guid")
        assert resp.status_code in (400, 404)
