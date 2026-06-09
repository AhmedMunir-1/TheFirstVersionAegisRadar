import os

MODEL_PATH = "models/fraud_model_v1 (1).pkl"
FEATURES_PATH = "models/feature_columns.pkl"

model = None
feature_columns = None

class MockFraudModel:
    """Mock XGBoost model for development when libomp is not available"""
    def predict_proba(self, X):
        import numpy as np
        # Simple heuristic: higher risk if merchant_degree is high, is_foreign is 1, or amount_ratio is high
        scores = []
        for idx, row in X.iterrows():
            risk = 0.1  # Base risk
            
            # Foreign transactions have higher risk
            if row.get('is_foreign', 0) == 1:
                risk += 0.15
            
            # High merchant degree increases risk
            merchant_degree = row.get('merchant_degree', 1)
            if merchant_degree > 200:
                risk += 0.1
            elif merchant_degree > 100:
                risk += 0.05
            
            # High amount ratio increases risk
            amount_ratio = row.get('amount_ratio', 1)
            if amount_ratio > 2:
                risk += 0.2
            
            # High user frequency lowers risk (legitimate behavior)
            user_freq = row.get('User_Frequency_Per_Day', 1)
            if user_freq > 5:
                risk = max(0, risk - 0.1)
            
            # Clamp to [0, 1]
            fraud_prob = min(1.0, max(0.0, risk))
            scores.append([1 - fraud_prob, fraud_prob])
        
        return np.array(scores)

def load_model():
    global model, feature_columns
    
    feature_columns = [
        'is_foreign',
        'User_Frequency_Per_Day',
        'amount_ratio',
        'MCC',
        'merchant_degree',
        'Time_Difference_Hours',
        'Hour',
        'user_degree'
    ]
    
    # Try to load real model first
    try:
        import joblib
        if os.path.exists(MODEL_PATH) and os.path.exists(FEATURES_PATH):
            model = joblib.load(MODEL_PATH)
            feature_columns = joblib.load(FEATURES_PATH)
            print("✓ Real XGBoost model loaded successfully.")
            print(f"  Features: {feature_columns}")
            return
    except Exception as e:
        print(f"⚠ Could not load XGBoost model: {type(e).__name__}")
    
    # Fall back to mock model
    model = MockFraudModel()
    print("✓ Using mock fraud detection model (development mode)")
    print(f"  Features: {feature_columns}")