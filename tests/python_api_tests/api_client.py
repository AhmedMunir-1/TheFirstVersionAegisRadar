"""
AegisRadar API Test Client
===========================
Reusable HTTP client wrapper that handles authentication,
headers, and provides convenience methods for every endpoint.
"""

import requests
from typing import Optional, Any
from config import BASE_URL, REQUEST_TIMEOUT


class AegisRadarClient:
    """Thin wrapper around requests that manages auth tokens and API keys."""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
        self.jwt_token: Optional[str] = None
        self.api_key: Optional[str] = None

    # ── Auth helpers ──────────────────────────────────────────────────────────

    def set_jwt(self, token: str):
        """Set JWT bearer token for subsequent requests."""
        self.jwt_token = token
        self.session.headers["Authorization"] = f"Bearer {token}"

    def clear_jwt(self):
        """Remove JWT token."""
        self.jwt_token = None
        self.session.headers.pop("Authorization", None)

    def set_api_key(self, key: str):
        """Set X-API-Key for transaction submission."""
        self.api_key = key

    # ── Low-level request ─────────────────────────────────────────────────────

    def _url(self, path: str) -> str:
        return f"{self.base_url}/{path.lstrip('/')}"

    def _request(
        self,
        method: str,
        path: str,
        json: Any = None,
        params: dict | None = None,
        extra_headers: dict | None = None,
        timeout: int = REQUEST_TIMEOUT,
    ) -> requests.Response:
        headers = {}
        if extra_headers:
            headers.update(extra_headers)

        return self.session.request(
            method=method,
            url=self._url(path),
            json=json,
            params=params,
            headers=headers,
            timeout=timeout,
        )

    # ── Auth Endpoints ────────────────────────────────────────────────────────

    def login(self, email: str, password: str) -> requests.Response:
        """POST /api/auth/login"""
        return self._request("POST", "/api/auth/login", json={
            "email": email,
            "password": password,
        })

    def register(
        self, company_name: str, email: str, password: str, country: str
    ) -> requests.Response:
        """POST /api/auth/register"""
        return self._request("POST", "/api/auth/register", json={
            "companyName": company_name,
            "email": email,
            "password": password,
            "country": country,
        })

    # ── Transaction Endpoints ─────────────────────────────────────────────────

    def submit_transaction(
        self,
        customer_id: str,
        amount: float,
        currency: str = "EGP",
        country: str = "EG",
        mcc: int = 5411,
        device_id: str = "dev_pytest_001",
        ip_address: str = "197.1.2.3",
        api_key: Optional[str] = None,
    ) -> requests.Response:
        """POST /api/transactions  (uses X-API-Key)"""
        key = api_key or self.api_key
        headers = {"X-API-Key": key} if key else {}
        return self._request("POST", "/api/transactions", json={
            "customerId": customer_id,
            "amount": amount,
            "currency": currency,
            "country": country,
            "mcc": mcc,
            "deviceId": device_id,
            "ipAddress": ip_address,
        }, extra_headers=headers)

    def list_transactions(
        self, page: int = 1, page_size: int = 20
    ) -> requests.Response:
        """GET /api/transactions  (JWT auth)"""
        return self._request("GET", "/api/transactions", params={
            "page": page,
            "pageSize": page_size,
        })

    def get_transaction(self, tx_id: str) -> requests.Response:
        """GET /api/transactions/{id}  (JWT auth)"""
        return self._request("GET", f"/api/transactions/{tx_id}")

    # ── Dashboard Endpoints ───────────────────────────────────────────────────

    def get_dashboard_stats(self) -> requests.Response:
        """GET /api/dashboard/stats  (JWT auth)"""
        return self._request("GET", "/api/dashboard/stats")

    def get_fraud_trends(self, days: int = 7) -> requests.Response:
        """GET /api/dashboard/trends  (JWT auth)"""
        return self._request("GET", "/api/dashboard/trends", params={"days": days})

    def get_recent_transactions(self, count: int = 10) -> requests.Response:
        """GET /api/dashboard/recent  (JWT auth)"""
        return self._request("GET", "/api/dashboard/recent", params={"count": count})

    # ── Alert Endpoints ───────────────────────────────────────────────────────

    def list_alerts(self, unread_only: bool = False) -> requests.Response:
        """GET /api/alerts  (JWT auth)"""
        return self._request("GET", "/api/alerts", params={
            "unreadOnly": str(unread_only).lower(),
        })

    def mark_alert_read(self, alert_id: str) -> requests.Response:
        """PUT /api/alerts/{id}/read  (JWT auth)"""
        return self._request("PUT", f"/api/alerts/{alert_id}/read")

    def mark_all_alerts_read(self) -> requests.Response:
        """PUT /api/alerts/read-all  (JWT auth)"""
        return self._request("PUT", "/api/alerts/read-all")

    # ── Merchant Endpoints ────────────────────────────────────────────────────

    def get_merchant_profile(self) -> requests.Response:
        """GET /api/merchants/me  (JWT auth)"""
        return self._request("GET", "/api/merchants/me")

    # ── Subscription Endpoints ────────────────────────────────────────────────

    def get_subscription_plans(self) -> requests.Response:
        """GET /api/subscriptions/plans  (public)"""
        return self._request("GET", "/api/subscriptions/plans")

    # ── Health ────────────────────────────────────────────────────────────────

    def health_check(self) -> requests.Response:
        """GET /health"""
        return self._request("GET", "/health")
