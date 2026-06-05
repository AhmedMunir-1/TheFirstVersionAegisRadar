from kafka import KafkaProducer
import json
import time
import random
import uuid
import requests
from datetime import datetime, timedelta

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Fetch merchants from backend API
BACKEND_API = "http://localhost:5099/api"

def get_merchants():
    """Fetch merchants from the backend database"""
    try:
        # Note: This endpoint requires authentication in production
        # For demo purposes, we're generating demo data with merchant IDs
        print("Generating demo merchants for transaction production...")
        return [
            {
                "id": str(uuid.uuid4()),
                "name": "Demo Merchant 1",
                "country": "EG"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Demo Merchant 2", 
                "country": "EG"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Demo Merchant 3",
                "country": "EG"
            }
        ]
    except Exception as e:
        print(f"Error fetching merchants: {e}")
        # Fallback to demo merchants
        return [
            {"id": "550e8400-e29b-41d4-a716-446655440000", "name": "Demo Merchant", "country": "EG"}
        ]

def generate_transaction(merchant_id, customer_id, is_fraud=False):
    """Generate a realistic transaction with merchant and customer context"""
    if is_fraud:
        return {
            "transactionId": str(uuid.uuid4()),
            "merchantId": merchant_id,
            "customerId": customer_id,
            "amount": round(random.uniform(1000, 50000), 2),
            "currency": "EGP",
            "transactionCountry": "EG",
            "merchantCountry": "EG",
            "mcc": random.choice([5411, 5300, 5912, 5651, 5970]),
            "deviceId": str(uuid.uuid4()),
            "ipAddress": f"192.168.{random.randint(0, 255)}.{random.randint(0, 255)}",
            "createdAt": datetime.utcnow().isoformat()
        }
    else:
        return {
            "transactionId": str(uuid.uuid4()),
            "merchantId": merchant_id,
            "customerId": customer_id,
            "amount": round(random.uniform(100, 5000), 2),
            "currency": "EGP",
            "transactionCountry": "EG",
            "merchantCountry": "EG",
            "mcc": random.choice([5411, 5300, 5912, 5651, 5970]),
            "deviceId": str(uuid.uuid4()),
            "ipAddress": f"192.168.{random.randint(0, 255)}.{random.randint(0, 255)}",
            "createdAt": datetime.utcnow().isoformat()
        }

# Get merchants
merchants = get_merchants()

print("Producer started. Sending transactions...")
print(f"Merchants: {len(merchants)}")
print("Press CTRL+C to stop.\n")

transaction_count = 0

while True:
    try:
        # Pick random merchant and customer
        merchant = random.choice(merchants)
        customer_id = str(uuid.uuid4())
        
        # 70% normal, 30% fraud
        is_fraud = random.random() > 0.70
        
        transaction = generate_transaction(merchant["id"], customer_id, is_fraud)
        txn_type = "FRAUD" if is_fraud else "NORMAL"
        
        producer.send('transactions.incoming', value=transaction)
        
        transaction_count += 1
        status = "🚨" if is_fraud else "✅"
        print(f"{status} [{txn_type}] #{transaction_count} | TxnID: {transaction['transactionId'][:8]}... | "
              f"Amount: {transaction['amount']} | Merchant: {merchant['name']}")
        
        time.sleep(2)
        
    except KeyboardInterrupt:
        print("\nProducer stopped.")
        break
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(5)
