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
    """Map fraud probability to decision"""
    if probability < 0.30:
        return "approved"
    elif probability <= 0.70:
        return "review"
    else:
        return "blocked"

def predict_transaction(transaction: dict) -> dict:
    """
    Predict fraud for a transaction
    
    Args:
        transaction: Dict with required features
    
    Returns:
        Dict with fraud_probability, decision, and model_version
    """
    try:
        # Create DataFrame and select features in correct order
        df = pd.DataFrame([transaction])
        df = df[FEATURE_COLUMNS]
        
        # Get prediction from model
        probability = model_loader.model.predict_proba(df)[0][1]
        decision = get_decision(probability)
        
        model_type = "xgboost" if model_loader.model.__class__.__name__ != "MockFraudModel" else "mock"
        
        return {
            "fraud_probability": round(float(probability), 4),
            "decision": decision,
            "model_version": f"{model_type}_v1"
        }
    except Exception as e:
        # Safe fallback
        return {
            "fraud_probability": 0.5,
            "decision": "review",
            "error": str(e),
            "model_version": "error"
        }