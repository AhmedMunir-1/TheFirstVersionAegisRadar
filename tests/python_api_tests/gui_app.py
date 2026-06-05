import os
import sys
from flask import Flask, request, jsonify, send_from_directory
from api_client import AegisRadarClient
from config import BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, DEMO_API_KEY
import uuid

app = Flask(__name__, static_folder="static")

# Shared client instance
client = AegisRadarClient(BASE_URL)

@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "baseUrl": BASE_URL,
        "demoEmail": DEMO_EMAIL,
        "demoPassword": DEMO_PASSWORD,
        "demoApiKey": DEMO_API_KEY
    })

@app.route("/api/run-scenario/login", methods=["POST"])
def scenario_login():
    data = request.json
    email = data.get("email", DEMO_EMAIL)
    password = data.get("password", DEMO_PASSWORD)
    
    resp = client.login(email, password)
    if resp.status_code == 200:
        token = resp.json().get("data", {}).get("token")
        if token:
            client.set_jwt(token)
    
    return jsonify({
        "status": resp.status_code,
        "data": resp.json() if resp.status_code in [200, 201, 400, 401, 404, 422, 500] else resp.text
    })

@app.route("/api/run-scenario/submit-tx", methods=["POST"])
def scenario_submit_tx():
    data = request.json
    amount = float(data.get("amount", 1500.0))
    customer_id = data.get("customerId", f"cust_{uuid.uuid4().hex[:8]}")
    mcc = int(data.get("mcc", 5411))
    country = data.get("country", "EG")
    
    client.set_api_key(DEMO_API_KEY)
    resp = client.submit_transaction(
        customer_id=customer_id,
        amount=amount,
        mcc=mcc,
        country=country
    )
    
    return jsonify({
        "status": resp.status_code,
        "data": resp.json() if resp.status_code in [200, 201, 202, 400, 401, 404, 422, 429, 500] else resp.text
    })

@app.route("/api/run-scenario/dashboard-stats", methods=["GET"])
def scenario_dashboard_stats():
    resp = client.get_dashboard_stats()
    return jsonify({
        "status": resp.status_code,
        "data": resp.json() if resp.status_code in [200, 401, 500] else resp.text
    })

@app.route("/api/run-scenario/alerts", methods=["GET"])
def scenario_alerts():
    resp = client.list_alerts()
    return jsonify({
        "status": resp.status_code,
        "data": resp.json() if resp.status_code in [200, 401, 500] else resp.text
    })

if __name__ == "__main__":
    print(f"Starting AegisRadar Test GUI on http://localhost:5055")
    app.run(host="0.0.0.0", port=5055, debug=True)
