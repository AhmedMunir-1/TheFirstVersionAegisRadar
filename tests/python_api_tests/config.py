"""
AegisRadar API Test Configuration
=================================
Central configuration for the test suite. Edit BASE_URL and credentials
to match your running environment.
"""

import os
from dotenv import load_dotenv

# Load .env if present (from project root)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# ─── API Base URL ─────────────────────────────────────────────────────────────
BASE_URL = os.getenv("AEGIS_TEST_BASE_URL", "http://localhost:5099")

# ─── Demo Credentials (seeded by DbSeeder) ───────────────────────────────────
DEMO_EMAIL = os.getenv("AEGIS_DEMO_EMAIL", "demo@aegisradar.io")
DEMO_PASSWORD = os.getenv("AEGIS_DEMO_PASSWORD", "Demo@1234")
DEMO_API_KEY = os.getenv("AEGIS_DEMO_API_KEY", "ar_demo_key_aegisradar_2024_secure")

# ─── Test Registration Credentials ───────────────────────────────────────────
TEST_COMPANY = "PyTest Corp"
TEST_EMAIL = "pytest-runner@aegisradar.io"
TEST_PASSWORD = "PyTest@Secure123"
TEST_COUNTRY = "EG"

# ─── Timeouts ────────────────────────────────────────────────────────────────
REQUEST_TIMEOUT = 15  # seconds
