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
    model_loader.load_model()
    yield

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
        "model_loaded": model_loader.model is not None
    }

@app.get("/model-info")
def model_info():
    return {
        "model": "XGBoost v1",
        "features": model_loader.feature_columns
    }

@app.post("/predict")
def predict(transaction: Transaction):
    if model_loader.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    result = predict_transaction(transaction.dict())
    return result