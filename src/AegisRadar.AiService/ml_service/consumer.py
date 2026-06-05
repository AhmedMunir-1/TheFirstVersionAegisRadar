from kafka import KafkaConsumer, KafkaProducer
import json
import requests
import uuid
from datetime import datetime

# Consumer — reads from transactions.incoming
consumer = KafkaConsumer(
    'transactions.incoming',
    bootstrap_servers='localhost:9092',
    value_deserializer=lambda v: json.loads(v.decode('utf-8')),
    auto_offset_reset='latest',
    group_id='aegisradar-consumer-group'
)

# Producer — sends results to predictions.results
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

FASTAPI_URL = "http://127.0.0.1:8001/predict"

print("Consumer started. Waiting for transactions...")
print("-" * 80)

transaction_count = 0

for message in consumer:
    transaction = message.value
    transaction_id = transaction.get('transaction_id', str(uuid.uuid4()))
    merchant_id = transaction.get('merchant_id')
    customer_id = transaction.get('customer_id')
    amount = transaction.get('amount', 0)

    payload = {
        "is_foreign": transaction["is_foreign"],
        "User_Frequency_Per_Day": transaction["User_Frequency_Per_Day"],
        "amount_ratio": transaction["amount_ratio"],
        "MCC": transaction["MCC"],
        "merchant_degree": transaction["merchant_degree"],
        "Time_Difference_Hours": transaction["Time_Difference_Hours"],
        "Hour": transaction["Hour"],
        "Card": transaction["Card"]
    }

    try:
        # Call FastAPI ML service
        response = requests.post(FASTAPI_URL, json=payload, timeout=10)
        result = response.json()

        fraud_probability = result["fraud_probability"]
        decision = result["decision"]
        model_version = result.get("model_version", "1.0.0")

        # Build final result with all transaction context
        final_result = {
            "transaction_id": transaction_id,
            "merchant_id": merchant_id,
            "customer_id": customer_id,
            "amount": amount,
            "fraud_probability": fraud_probability,
            "decision": decision,
            "model_version": model_version,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Publish result to predictions.results topic
        producer.send('predictions.results', value=final_result)

        # Print result clearly
        transaction_count += 1
        status_icon = "✅" if decision == "APPROVED" else "⚠️" if decision == "REVIEW" else "🚨"
        print(f"#{transaction_count} {status_icon} [{decision}] | TxnID: {transaction_id[:8]}... | "
              f"Amount: {amount} | Probability: {fraud_probability:.2%} | Model: {model_version}")

    except requests.exceptions.Timeout:
        print(f"❌ Timeout calling ML service for transaction {transaction_id[:8]}...")
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection error to ML service for transaction {transaction_id[:8]}...")
    except Exception as e:
        print(f"❌ Error processing transaction {transaction_id[:8]}...: {e}")