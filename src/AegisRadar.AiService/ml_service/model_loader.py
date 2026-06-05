import joblib
import os

MODEL_PATH = "models/fraud_model_v1 (1).pkl"
FEATURES_PATH = "models/feature_columns.pkl"

model = None
feature_columns = None

def load_model():
    global model, feature_columns
    
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
    
    if not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError(f"Features file not found at {FEATURES_PATH}")
    
    model = joblib.load(MODEL_PATH)
    feature_columns = joblib.load(FEATURES_PATH)
    
    print("Model loaded successfully.")
    print(f"Expected features: {feature_columns}")