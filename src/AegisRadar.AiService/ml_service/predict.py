import pandas as pd
import model_loader

FEATURE_COLUMNS = [
    'is_foreign',
    'User_Frequency_Per_Day',
    'amount_ratio',
    'MCC',
    'merchant_degree',
    'Time_Difference_Hours',
    'Hour',
    'user_degree'
]

def get_decision(probability: float) -> str:
    if probability < 0.30:
        return "approved"
    elif probability <= 0.70:
        return "review"
    else:
        return "blocked"

def predict_transaction(transaction: dict) -> dict:
    df = pd.DataFrame([transaction])
    df = df[FEATURE_COLUMNS]
    
    probability = model_loader.model.predict_proba(df)[0][1]
    decision = get_decision(probability)
    
    return {
        "fraud_probability": round(float(probability), 4),
        "decision": decision,
        "model_version": "xgboost_v1"
    }