#!/usr/bin/env python3


"""
AegisRadar API Test Suite
Comprehensive test script for the AegisRadar fraud detection platform
"""

import argparse
import random
import requests
import json
import time
from typing import Optional, Dict, Any
from datetime import datetime



# Configuration
BASE_URL = "http://localhost:5099/api"
API_KEY = "ar_demo_key_aegisradar_2024_secure"
DEMO_EMAIL = "demo@aegisradar.io"
DEMO_PASSWORD = "Demo@1234"



class AegisRadarTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.jwt_token: Optional[str] = None
        self.colors = {
            'PASS': '\033[92m',  # Green
            'FAIL': '\033[91m',  # Red
            'INFO': '\033[94m',  # Blue
            'WARN': '\033[93m',  # Yellow
            'END': '\033[0m'     # Reset
        }

    def print_result(self, test_name: str, passed: bool, message: str = ""):
        color = self.colors['PASS'] if passed else self.colors['FAIL']
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{color}{status}{self.colors['END']} | {test_name} {message}")

    def print_info(self, message: str):
        print(f"{self.colors['INFO']}ℹ {message}{self.colors['END']}")

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # AUTHENTICATION TESTS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def test_login(self) -> bool:
        """Test merchant login with demo credentials"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
            )
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                self.print_result("Login", True, f"(Token: {self.jwt_token[:20]}...)")
                return True
            else:
                self.print_result("Login", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Login", False, str(e))
            return False

    def test_register_new_merchant(self) -> bool:
        """Test new merchant registration"""
        try:
            timestamp = int(time.time())
            payload = {
                "companyName": f"Test Company {timestamp}",
                "email": f"test{timestamp}@example.com",
                "password": "SecurePass@123",
                "country": "EG"
            }
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=payload
            )
            if response.status_code == 201:
                self.print_result("Register Merchant", True, f"(Email: {payload['email']})")
                return True
            else:
                self.print_result("Register Merchant", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Register Merchant", False, str(e))
            return False

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # TRANSACTION TESTS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def test_submit_transaction(
        self,
        amount: float = 1500.00,
        country: str = "EG",
        customer_id: Optional[str] = None,
        device_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        currency: str = "EGP",
        mcc: int = 5411,
        quiet: bool = False
    ) -> Optional[str]:
        """Submit a transaction and return transaction ID"""
        try:
            timestamp = int(time.time() * 1000)
            payload = {
                "customerId": customer_id or f"cust_{timestamp}",
                "amount": amount,
                "currency": currency,
                "country": country,
                "mcc": mcc,
                "deviceId": device_id or f"dev_{timestamp}",
                "ipAddress": ip_address or f"197.1.2.{random.randint(1, 254)}"
            }
            
            headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
            response = self.session.post(
                f"{self.base_url}/transactions",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 202:
                data = response.json()
                tx_id = data.get("transactionId") or data.get("id")
                if not quiet:
                    self.print_result("Submit Transaction", True, f"(Amount: {amount} {currency}, Country: {country}, TxID: {tx_id})")
                return tx_id
            else:
                if not quiet:
                    self.print_result("Submit Transaction", False, f"Status: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            if not quiet:
                self.print_result("Submit Transaction", False, str(e))
            return None

    def bulk_submit_transactions(
        self,
        count: int = 100,
        unique_customers: int = 10,
        quiet: bool = False
    ) -> Dict[str, Any]:
        """Submit a batch of synthetic transactions to build customer history."""
        customers = [f"cust_{i}_{int(time.time())}" for i in range(1, unique_customers + 1)]
        mcc_choices = [5411, 5311, 5812, 6011, 4814, 5732, 5912]
        country_choices = ["EG", "US", "GB", "DE", "AE", "FR", "IN"]
        amounts = [25.0, 75.0, 150.0, 320.0, 880.0, 1800.0, 5500.0, 22000.0, 47000.0]

        results = {"submitted": 0, "failed": 0, "transactionIds": []}

        for i in range(count):
            customer_id = random.choice(customers)
            country = random.choice(country_choices)
            amount = random.choice(amounts)
            mcc = random.choice(mcc_choices)
            currency = "USD" if country != "EG" else "EGP"
            device_id = f"dev_{customer_id}_{i}"
            ip_address = f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

            tx_id = self.test_submit_transaction(
                amount=amount,
                country=country,
                customer_id=customer_id,
                device_id=device_id,
                ip_address=ip_address,
                currency=currency,
                mcc=mcc,
                quiet=quiet
            )

            if tx_id:
                results["submitted"] += 1
                results["transactionIds"].append(tx_id)
            else:
                results["failed"] += 1

            # Pace requests so the backend and worker can process smoothly.
            time.sleep(0.05)

        if not quiet:
            self.print_result(
                "Bulk Transaction Seed",
                results["failed"] == 0,
                f"(submitted={results['submitted']}, failed={results['failed']})"
            )
        return results
    

    def test_submit_high_risk_transaction(self) -> Optional[str]:
        """Submit a high-risk transaction (cross-border, high amount)"""
        return self.test_submit_transaction(amount=50000.00, country="US")

    def test_list_transactions(self) -> bool:
        """Get list of transactions"""
        try:
            response = self.session.get(
                f"{self.base_url}/transactions",
                params={"page": 1, "pageSize": 20}
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("data", []))
                self.print_result("List Transactions", True, f"(Count: {count})")
                return True
            else:
                self.print_result("List Transactions", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("List Transactions", False, str(e))
            return False

    def test_get_transaction(self, transaction_id: str) -> bool:
        """Get single transaction by ID"""
        try:
            response = self.session.get(f"{self.base_url}/transactions/{transaction_id}")
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                fraud_prob = data.get("prediction", {}).get("fraudProbability")
                self.print_result("Get Transaction", True, f"(Status: {status}, Fraud: {fraud_prob})")
                return True
            else:
                self.print_result("Get Transaction", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Get Transaction", False, str(e))
            return False

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # DASHBOARD TESTS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def test_dashboard_stats(self) -> bool:
        """Get dashboard statistics"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard/stats")
            if response.status_code == 200:
                data = response.json()
                total_tx = data.get("totalTransactions", 0)
                fraud_rate = data.get("fraudRate", 0)
                self.print_result("Dashboard Stats", True, f"(Total: {total_tx}, Fraud Rate: {fraud_rate}%)")
                return True
            else:
                self.print_result("Dashboard Stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Dashboard Stats", False, str(e))
            return False

    def test_dashboard_trends(self, days: int = 7) -> bool:
        """Get fraud trends over N days"""
        try:
            response = self.session.get(
                f"{self.base_url}/dashboard/trends",
                params={"days": days}
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("trends", []))
                self.print_result("Dashboard Trends", True, f"(Days: {days}, Data Points: {count})")
                return True
            else:
                self.print_result("Dashboard Trends", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Dashboard Trends", False, str(e))
            return False

    def test_dashboard_recent(self) -> bool:
        """Get recent transactions"""
        try:
            response = self.session.get(
                f"{self.base_url}/dashboard/recent",
                params={"count": 10}
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("transactions", []))
                self.print_result("Dashboard Recent", True, f"(Count: {count})")
                return True
            else:
                self.print_result("Dashboard Recent", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Dashboard Recent", False, str(e))
            return False

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # ALERTS TESTS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def test_get_alerts(self) -> bool:
        """Get all alerts"""
        try:
            response = self.session.get(f"{self.base_url}/alerts")
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("data", []))
                self.print_result("Get Alerts", True, f"(Count: {count})")
                return True
            else:
                self.print_result("Get Alerts", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Get Alerts", False, str(e))
            return False

    def test_get_unread_alerts(self) -> bool:
        """Get only unread alerts"""
        try:
            response = self.session.get(
                f"{self.base_url}/alerts",
                params={"unreadOnly": True}
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("data", []))
                self.print_result("Get Unread Alerts", True, f"(Count: {count})")
                return True
            else:
                self.print_result("Get Unread Alerts", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Get Unread Alerts", False, str(e))
            return False

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # MERCHANT & SUBSCRIPTION TESTS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def test_get_merchant_profile(self) -> bool:
        """Get authenticated merchant profile"""
        try:
            response = self.session.get(f"{self.base_url}/merchants/me")
            if response.status_code == 200:
                data = response.json()
                email = data.get("email")
                plan = data.get("plan", {}).get("name")
                self.print_result("Get Merchant Profile", True, f"(Email: {email}, Plan: {plan})")
                return True
            else:
                self.print_result("Get Merchant Profile", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Get Merchant Profile", False, str(e))
            return False

    def test_get_subscription_plans(self) -> bool:
        """Get all subscription plans"""
        try:
            response = self.session.get(f"{self.base_url}/subscriptions/plans")
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("data", []))
                self.print_result("Get Subscription Plans", True, f"(Count: {count})")
                return True
            else:
                self.print_result("Get Subscription Plans", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Get Subscription Plans", False, str(e))
            return False

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # HEALTH TESTS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def test_health_check(self) -> bool:
        """Check API health"""
        try:
            response = self.session.get(f"{self.base_url.replace('/api', '')}/health")
            if response.status_code == 200:
                self.print_result("Health Check", True)
                return True
            else:
                self.print_result("Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Health Check", False, str(e))
            return False

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # MAIN TEST RUNNER
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("\n" + "="*70)
        print("AegisRadar API Test Suite")
        print("="*70 + "\n")

        self.print_info(f"Testing: {self.base_url}")
        self.print_info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        results = {}

        # Health Check
        print("━ Health & Basic Connectivity")
        results['health'] = self.test_health_check()
        time.sleep(0.5)

        # Authentication
        print("\n━ Authentication")
        results['login'] = self.test_login()
        results['register'] = self.test_register_new_merchant()
        time.sleep(0.5)

        # Transactions
        print("\n━ Transactions")
        tx_id = self.test_submit_transaction()
        results['submit_tx'] = tx_id is not None
        
        results['submit_high_risk_tx'] = self.test_submit_high_risk_transaction() is not None
        time.sleep(1)  # Wait for transaction processing
        
        if tx_id:
            results['get_tx'] = self.test_get_transaction(tx_id)
        
        results['list_tx'] = self.test_list_transactions()
        time.sleep(0.5)

        # Dashboard
        print("\n━ Dashboard")
        results['stats'] = self.test_dashboard_stats()
        results['trends'] = self.test_dashboard_trends()
        results['recent'] = self.test_dashboard_recent()
        time.sleep(0.5)

        # Alerts
        print("\n━ Alerts")
        results['alerts'] = self.test_get_alerts()
        results['unread_alerts'] = self.test_get_unread_alerts()
        time.sleep(0.5)

        # Merchant
        print("\n━ Merchant & Subscription")
        results['profile'] = self.test_get_merchant_profile()
        results['plans'] = self.test_get_subscription_plans()

        # Summary
        print("\n" + "="*70)
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        percentage = (passed / total * 100) if total > 0 else 0
        
        print(f"Results: {passed}/{total} tests passed ({percentage:.1f}%)")
        print("="*70 + "\n")

        return results
    
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AegisRadar API test and seed utility")
    parser.add_argument("--seed", type=int, default=0, help="Generate and submit a batch of synthetic transactions")
    parser.add_argument("--customers", type=int, default=10, help="Unique synthetic customers to use for seeding")
    parser.add_argument("--api-key", type=str, default=API_KEY, help="Override the X-API-Key header used for transaction submission")
    parser.add_argument("--base-url", type=str, default=BASE_URL, help="Override the base API URL")
    parser.add_argument("--quiet", action="store_true", help="Suppress per-transaction output")
    args = parser.parse_args()

    API_KEY = args.api_key
    BASE_URL = args.base_url

    tester = AegisRadarTester()
    if args.seed > 0:
        tester.bulk_submit_transactions(count=args.seed, unique_customers=args.customers, quiet=args.quiet)
    else:
        tester.run_all_tests()
