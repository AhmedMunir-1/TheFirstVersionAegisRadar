from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import model_loader
from predict import predict_transaction

# Define the shape of incoming transaction
class Transaction(BaseModel):
    is_foreign: int
    User_Frequency_Per_Day: int
    amount_ratio: float
    MCC: int
    merchant_degree: int
    Time_Difference_Hours: float
    Hour: int
    user_degree: int

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    try:
        model_loader.load_model()
        print("✓ Model loaded successfully")
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        print("✓ Using fallback/mock model")
    yield
    # Cleanup if needed
    print("Shutting down ML service")

app = FastAPI(
    title="AegisRadar ML Service",
    description="Real-time fraud detection API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "online",
        "model_loaded": model_loader.model is not None,
        "model_type": model_loader.model.__class__.__name__ if model_loader.model else "None"
    }

@app.get("/model-info")
def model_info():
    model_type = model_loader.model.__class__.__name__ if model_loader.model else "None"
    return {
        "model": f"{model_type} v1",
        "features": model_loader.feature_columns,
        "ready": model_loader.model is not None
    }

@app.post("/predict")
def predict(transaction: Transaction):
    if model_loader.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    result = predict_transaction(transaction.dict())
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )