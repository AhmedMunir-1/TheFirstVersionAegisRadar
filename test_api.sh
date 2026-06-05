#!/bin/bash

# AegisRadar API Test Script (BASH/cURL)
# Quick testing with curl commands

BASE_URL="http://localhost:5099/api"
API_KEY="ar_demo_key_aegisradar_2024_secure"
DEMO_EMAIL="demo@aegisradar.io"
DEMO_PASSWORD="Demo@1234"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_pass() {
    echo -e "${GREEN}✓ PASS${NC} | $1"
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC} | $1"
}

print_info() {
    echo -e "${BLUE}ℹ INFO${NC} | $1"
}

print_section() {
    echo ""
    echo -e "${YELLOW}━ $1${NC}"
}

# Test 1: Health Check
test_health() {
    print_section "Health & Basic Connectivity"
    response=$(curl -s -w "\n%{http_code}" http://localhost:5099/health)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 200 ]; then
        print_pass "Health Check"
    else
        print_fail "Health Check (HTTP $http_code)"
    fi
}

# Test 2: Login
test_login() {
    print_section "Authentication"
    
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$DEMO_EMAIL\", \"password\": \"$DEMO_PASSWORD\"}")
    
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        print_pass "Login"
        export JWT_TOKEN="$TOKEN"
    else
        print_fail "Login"
        echo "Response: $response"
    fi
}

# Test 3: Submit Transaction
test_submit_transaction() {
    print_section "Transactions"
    
    TIMESTAMP=$(date +%s%N)
    
    response=$(curl -s -X POST "$BASE_URL/transactions" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"customerId\": \"cust_$TIMESTAMP\",
            \"amount\": 1500.00,
            \"currency\": \"EGP\",
            \"country\": \"EG\",
            \"mcc\": 5411,
            \"deviceId\": \"dev_test\",
            \"ipAddress\": \"197.1.2.3\"
        }")
    
    TX_ID=$(echo "$response" | grep -o '"transactionId":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TX_ID" ]; then
        print_pass "Submit Transaction (ID: $TX_ID)"
        export TRANSACTION_ID="$TX_ID"
    else
        print_fail "Submit Transaction"
        echo "Response: $response"
    fi
}

# Test 4: Submit High-Risk Transaction
test_submit_high_risk() {
    TIMESTAMP=$(date +%s%N)
    
    response=$(curl -s -X POST "$BASE_URL/transactions" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"customerId\": \"cust_high_risk_$TIMESTAMP\",
            \"amount\": 50000.00,
            \"currency\": \"EGP\",
            \"country\": \"US\",
            \"mcc\": 6211,
            \"deviceId\": \"dev_suspicious\",
            \"ipAddress\": \"8.8.8.8\"
        }")
    
    if echo "$response" | grep -q "transactionId"; then
        print_pass "Submit High-Risk Transaction"
    else
        print_fail "Submit High-Risk Transaction"
    fi
}

# Test 5: List Transactions
test_list_transactions() {
    if [ -z "$JWT_TOKEN" ]; then
        print_fail "List Transactions (No JWT token)"
        return
    fi
    
    response=$(curl -s -X GET "$BASE_URL/transactions?page=1&pageSize=20" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if echo "$response" | grep -q "data"; then
        print_pass "List Transactions"
    else
        print_fail "List Transactions"
    fi
}

# Test 6: Get Single Transaction
test_get_transaction() {
    if [ -z "$JWT_TOKEN" ] || [ -z "$TRANSACTION_ID" ]; then
        print_fail "Get Transaction (Missing prerequisites)"
        return
    fi
    
    response=$(curl -s -X GET "$BASE_URL/transactions/$TRANSACTION_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if echo "$response" | grep -q "status"; then
        print_pass "Get Transaction"
    else
        print_fail "Get Transaction"
    fi
}

# Test 7: Dashboard Stats
test_dashboard_stats() {
    print_section "Dashboard"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_fail "Dashboard Stats (No JWT token)"
        return
    fi
    
    response=$(curl -s -X GET "$BASE_URL/dashboard/stats" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if echo "$response" | grep -q "totalTransactions"; then
        print_pass "Dashboard Stats"
    else
        print_fail "Dashboard Stats"
    fi
}

# Test 8: Dashboard Trends
test_dashboard_trends() {
    if [ -z "$JWT_TOKEN" ]; then
        print_fail "Dashboard Trends (No JWT token)"
        return
    fi
    
    response=$(curl -s -X GET "$BASE_URL/dashboard/trends?days=7" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if echo "$response" | grep -q "trends"; then
        print_pass "Dashboard Trends"
    else
        print_fail "Dashboard Trends"
    fi
}

# Test 9: Get Alerts
test_get_alerts() {
    print_section "Alerts"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_fail "Get Alerts (No JWT token)"
        return
    fi
    
    response=$(curl -s -X GET "$BASE_URL/alerts" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if echo "$response" | grep -q "data"; then
        print_pass "Get Alerts"
    else
        print_fail "Get Alerts"
    fi
}

# Test 10: Merchant Profile
test_merchant_profile() {
    print_section "Merchant & Subscription"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_fail "Get Merchant Profile (No JWT token)"
        return
    fi
    
    response=$(curl -s -X GET "$BASE_URL/merchants/me" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if echo "$response" | grep -q "email"; then
        print_pass "Get Merchant Profile"
    else
        print_fail "Get Merchant Profile"
    fi
}

# Test 11: Get Plans
test_subscription_plans() {
    response=$(curl -s -X GET "$BASE_URL/subscriptions/plans")
    
    if echo "$response" | grep -q "data"; then
        print_pass "Get Subscription Plans"
    else
        print_fail "Get Subscription Plans"
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "========================================================================"
echo "AegisRadar API Test Suite (BASH/cURL)"
echo "========================================================================"

print_info "Testing: $BASE_URL"
print_info "Time: $(date '+%Y-%m-%d %H:%M:%S')"

# Run all tests
test_health
test_login
test_submit_transaction
test_submit_high_risk
sleep 1  # Wait for async processing
test_list_transactions
test_get_transaction
test_dashboard_stats
test_dashboard_trends
test_get_alerts
test_merchant_profile
test_subscription_plans

echo ""
echo "========================================================================"
echo "Test Suite Completed"
echo "========================================================================"
echo ""
