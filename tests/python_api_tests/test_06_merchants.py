"""
Test Suite: Merchant Profile & Subscriptions
=============================================
Covers:
  - GET /api/merchants/me (authenticated profile)
  - GET /api/subscriptions/plans (public)
  - Auth enforcement on merchant profile
  - Subscription plan data validation
"""

import pytest


class TestMerchantProfile:
    """Scenario: GET /api/merchants/me — authenticated merchant profile"""

    def test_get_profile_success(self, auth_client):
        """Authenticated request should return 200 with merchant data."""
        resp = auth_client.get_merchant_profile()
        assert resp.status_code == 200

        body = resp.json()
        assert body["success"] is True

    def test_profile_response_structure(self, auth_client):
        """Profile should contain expected merchant fields."""
        data = auth_client.get_merchant_profile().json()["data"]
        expected = ["id", "companyName", "email", "country", "apiKey", "role", "plan", "createdAt"]
        for field in expected:
            assert field in data, f"Missing field: {field}"

    def test_profile_demo_merchant_data(self, auth_client):
        """Demo merchant should have known email and company."""
        data = auth_client.get_merchant_profile().json()["data"]
        assert data["email"] == "demo@aegisradar.io"

    def test_profile_has_api_key(self, auth_client):
        """Profile should expose the merchant's API key."""
        data = auth_client.get_merchant_profile().json()["data"]
        assert data["apiKey"] is not None
        assert len(data["apiKey"]) > 0

    def test_profile_unauthenticated(self, unauth_client):
        """Profile without JWT should return 401."""
        resp = unauth_client.get_merchant_profile()
        assert resp.status_code == 401


class TestSubscriptionPlans:
    """Scenario: GET /api/subscriptions/plans — public endpoint"""

    def test_plans_returns_200(self, client):
        """Plans endpoint should be publicly accessible."""
        resp = client.get_subscription_plans()
        assert resp.status_code == 200

    def test_plans_count(self, client):
        """Should return exactly 3 plans (Starter, Business, Enterprise)."""
        data = client.get_subscription_plans().json()["data"]
        assert len(data) == 3

    def test_starter_plan(self, client):
        """Starter plan should have correct details."""
        plans = client.get_subscription_plans().json()["data"]
        starter = next((p for p in plans if p["name"] == "Starter"), None)
        assert starter is not None
        assert starter["transactionLimit"] == 5000
        assert starter["monthlyPrice"] == 299

    def test_business_plan(self, client):
        """Business plan should have correct details."""
        plans = client.get_subscription_plans().json()["data"]
        business = next((p for p in plans if p["name"] == "Business"), None)
        assert business is not None
        assert business["transactionLimit"] == 25000
        assert business["monthlyPrice"] == 999

    def test_enterprise_plan(self, client):
        """Enterprise plan should have unlimited transactions (limit = -1)."""
        plans = client.get_subscription_plans().json()["data"]
        enterprise = next((p for p in plans if p["name"] == "Enterprise"), None)
        assert enterprise is not None
        assert enterprise["transactionLimit"] == -1
        assert enterprise["monthlyPrice"] == 2999

    def test_plans_have_features(self, client):
        """Each plan should have a non-empty features array."""
        plans = client.get_subscription_plans().json()["data"]
        for plan in plans:
            assert "features" in plan
            assert isinstance(plan["features"], list)
            assert len(plan["features"]) > 0

    def test_plans_no_auth_required(self, unauth_client):
        """Subscription plans should work without any authentication."""
        resp = unauth_client.get_subscription_plans()
        assert resp.status_code == 200
