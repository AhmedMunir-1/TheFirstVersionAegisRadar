# AegisRadar — AI-Powered Fraud Detection Platform

> **Graduation Project** — A production-grade B2B SaaS backend for real-time transaction fraud detection targeting Egyptian merchants.  
> Built with **Clean Architecture** (Domain → Application → Infrastructure → API) on **.NET 10**.

---

## 🏗️ Architecture Overview

```
┌──────────────┐     ┌─────────────────┐     ┌───────────┐     ┌────────────────────┐
│  Merchant    │     │  ASP.NET Core   │     │  Apache   │     │  Worker Service    │
│  App / API   │────▶│  API (Port 5000)│────▶│  Kafka    │────▶│  (Kafka Consumer)  │
│  Client      │     │  + Swagger      │     │           │     │                    │
└──────────────┘     └────────┬────────┘     └───────────┘     └────────┬───────────┘
                              │                                         │
                              │  JWT Auth                               │ Feature Engineering
                              │  Rate Limiting                          │ + Call External AI API
                              │  API Key Auth                           ▼
                     ┌────────▼────────┐                      ┌────────────────────┐
                     │   SQL Server    │◀─────────────────────│ External AI/ML API │
                     │   (EF Core 10)  │     Persist Result   │ (FastAPI / Any)    │
                     └────────┬────────┘                      └────────────────────┘
                              │
                     ┌────────▼────────┐     ┌───────────┐
                     │   Redis Cache   │     │  SignalR   │──▶ Real-time Dashboard
                     │   (30s TTL)     │     │  WebSocket │
                     └─────────────────┘     └───────────┘
```

### Technology Stack

| Layer              | Technology                                       |
| ------------------ | ------------------------------------------------ |
| **API**            | ASP.NET Core 10, Minimal + Controllers           |
| **Authentication** | JWT Bearer + API Key Middleware                   |
| **CQRS / Mediator**| MediatR                                          |
| **Validation**     | FluentValidation                                 |
| **Database**       | SQL Server 2022 + Entity Framework Core 10       |
| **Cache**          | Redis 7 (StackExchange.Redis)                    |
| **Messaging**      | Apache Kafka (Confluent 7.6)                     |
| **Background Jobs**| Hangfire (SQL Server storage)                    |
| **Real-time**      | SignalR WebSocket Hub                            |
| **Logging**        | Serilog (Console + File, structured JSON)        |
| **Containers**     | Docker + Docker Compose                          |
| **AI Integration** | External HTTP API (configurable endpoint)        |

---

## 📁 Project Structure

```
AegisRadarBackend/
├── src/
│   ├── AegisRadar.Domain/            # Core domain layer (zero dependencies)
│   │   ├── Entities/                  # Transaction, Merchant, Prediction, Alert,
│   │   │                             # SubscriptionPlan, MerchantSubscription,
│   │   │                             # TransactionHistory, BaseEntity
│   │   ├── Enums/                     # TransactionStatus, FraudDecision, AlertSeverity
│   │   ├── Events/                    # Domain events
│   │   └── Interfaces/               # Repository & service contracts
│   │
│   ├── AegisRadar.Application/       # Use cases & business logic
│   │   ├── Features/
│   │   │   ├── Auth/                  # Login & Register commands (CQRS)
│   │   │   ├── Transactions/          # Submit, Get, List transactions
│   │   │   ├── Dashboard/             # Stats, Trends, Recent queries
│   │   │   └── Alerts/               # Get alerts, Mark read commands
│   │   ├── DTOs/                      # Request/Response data transfer objects
│   │   ├── Interfaces/               # Application service contracts
│   │   └── Validators/               # FluentValidation rules
│   │
│   ├── AegisRadar.Infrastructure/    # External concerns implementation
│   │   ├── Persistence/
│   │   │   ├── AegisRadarDbContext.cs
│   │   │   ├── Configurations/        # EF Core entity configurations
│   │   │   ├── Repositories/          # Transaction, Merchant, Alert, Prediction,
│   │   │   │                          # TransactionHistory repositories
│   │   │   └── Seed/                  # DbSeeder (demo data + subscription plans)
│   │   ├── Cache/                     # RedisCacheService
│   │   ├── Kafka/                     # KafkaProducer + KafkaSettings
│   │   ├── Jobs/                      # FraudSummaryJob (Hangfire daily)
│   │   ├── Services/                  # FraudDetectionService (external AI HTTP client),
│   │   │                              # FeatureEngineeringService, TokenService,
│   │   │                              # SignalRNotificationService
│   │   └── InfrastructureServiceRegistration.cs  # DI composition root
│   │
│   ├── AegisRadar.API/               # Presentation layer
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs      # POST /api/auth/login, /register
│   │   │   ├── TransactionsController # POST|GET /api/transactions
│   │   │   ├── DashboardController    # GET stats, trends, recent
│   │   │   ├── AlertsController       # GET|PUT /api/alerts
│   │   │   └── MerchantsController    # GET /api/merchants/me
│   │   ├── Hubs/                      # FraudAlertHub (SignalR)
│   │   ├── Middleware/                # ExceptionHandling + ApiKey middleware
│   │   ├── Extensions/
│   │   ├── Program.cs                 # Application entry point
│   │   └── Dockerfile
│   │
│   ├── AegisRadar.Worker/            # Background Kafka consumer service
│   │   ├── Consumers/                 # Kafka message consumers
│   │   ├── Services/
│   │   ├── Worker.cs
│   │   ├── Program.cs
│   │   └── Dockerfile
│   │
│   └── AegisRadar.Shared/            # Cross-cutting shared code
│       ├── Constants/                 # SubscriptionPlanNames, etc.
│       ├── Events/                    # Integration events
│       └── Wrappers/                  # ApiResponse<T> unified wrapper
│
├── tests/
│   ├── AegisRadar.UnitTests/
│   └── AegisRadar.IntegrationTests/
│
├── docker-compose.yml                # SQL Server, Kafka, Zookeeper, Redis, API, Worker
├── .env.example                       # Environment variable template
├── AegisRadar.sln                     # Solution file
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)

### 1. Clone & Configure

```bash
git clone <repository-url>
cd AegisRadarBackend

# Create your local environment file
cp .env.example .env
```

Edit `.env` with your settings:

```env
SQL_PASSWORD=AegisRadar@2024!
JWT_SECRET=AegisRadar_SuperSecret_JWT_Key_2024_Production_Replace_Me!!
AI_API_URL=http://your-ai-api-host
AI_API_PREDICT_ENDPOINT=/predict
```

### 2. Start All Services (Docker)

```bash
docker-compose up --build
```

This starts: **SQL Server**, **Zookeeper**, **Kafka**, **Redis**, **AegisRadar API**, and **AegisRadar Worker**.

### 3. Run Locally (Development)

```bash
# Start infrastructure services only
docker-compose up sqlserver zookeeper kafka redis -d

# Run the API
dotnet run --project src/AegisRadar.API/

# In a separate terminal, run the Worker
dotnet run --project src/AegisRadar.Worker/
```

### 4. Access Services

| Service            | URL                                 |
| ------------------ | ----------------------------------- |
| API + Swagger      | http://localhost:5000/swagger        |
| Health Check       | http://localhost:5000/health         |
| Hangfire Dashboard | http://localhost:5000/hangfire       |
| SignalR Hub        | ws://localhost:5000/hubs/fraud-alerts|

---

## 🔑 Demo Credentials

The database is auto-seeded on first run with demo data:

| Field     | Value                                |
| --------- | ------------------------------------ |
| Email     | `demo@aegisradar.io`                 |
| Password  | `Demo@1234`                          |
| API Key   | `ar_demo_key_aegisradar_2024_secure` |
| Plan      | Starter (5,000 tx/month)             |

The seeder also creates **50 demo transactions** with predictions and alerts.

---

## 📡 API Reference

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "demo@aegisradar.io",
  "password": "Demo@1234"
}
```
**Response:** `200 OK` — Returns JWT token.

#### Register New Merchant
```http
POST /api/auth/register
Content-Type: application/json

{
  "companyName": "My Company",
  "email": "merchant@example.com",
  "password": "SecurePass@123",
  "country": "EG"
}
```
**Response:** `201 Created` — Returns JWT token. Auto-assigned Starter plan.

---

### Transactions

#### Submit Transaction (API Key Auth)
```http
POST /api/transactions
X-API-Key: ar_demo_key_aegisradar_2024_secure
Content-Type: application/json

{
  "customerId": "cust_001",
  "amount": 1500.00,
  "currency": "EGP",
  "country": "EG",
  "mcc": 5411,
  "deviceId": "dev_abc123",
  "ipAddress": "197.1.2.3"
}
```
**Response:** `202 Accepted` — Transaction enqueued to Kafka for async fraud analysis.

#### List Transactions (JWT Auth)
```http
GET /api/transactions?page=1&pageSize=20
Authorization: Bearer <jwt-token>
```

#### Get Transaction by ID (JWT Auth)
```http
GET /api/transactions/{id}
Authorization: Bearer <jwt-token>
```

---

### Dashboard (JWT Auth Required)

```http
GET /api/dashboard/stats          # Real-time stats (cached 30s in Redis)
GET /api/dashboard/trends?days=7  # Fraud trends over N days
GET /api/dashboard/recent?count=10 # Recent transactions feed
```

---

### Alerts (JWT Auth Required)

```http
GET  /api/alerts?unreadOnly=true   # List alerts (filter by unread)
PUT  /api/alerts/{id}/read         # Mark single alert as read
PUT  /api/alerts/read-all          # Mark all alerts as read
```

---

### Merchant Profile (JWT Auth Required)

```http
GET /api/merchants/me              # Get authenticated merchant profile
```

---

### Subscription Plans (Public)

```http
GET /api/subscriptions/plans       # List all available plans
```

---

## 🤖 AI Integration — External Fraud Detection API

AegisRadar does **not** embed an ML model. Instead, it calls an **external AI API** that you configure.

### Configuration

Set the following in `.env` or `appsettings.json`:

```env
AI_API_URL=http://your-ai-api-host
AI_API_PREDICT_ENDPOINT=/predict
```

### Request Sent to AI API

The backend performs **Feature Engineering** (8 features) and sends:

```json
{
  "amount_ratio": 1.5,
  "Hour": 14,
  "is_foreign": 0,
  "user_degree": 3,
  "merchant_degree": 120,
  "MCC": 5411,
  "User_Frequency_Per_Day": 2,
  "Time_Difference_Hours": 6.5
}
```

### Expected Response from AI API

```json
{
  "fraud_probability": 0.82,
  "decision": "blocked"
}
```

### Fraud Decision Thresholds

| Probability | Decision       |
| ----------- | -------------- |
| < 0.4       | ✅ `approved`  |
| 0.4 – 0.7   | ⚠️ `review`   |
| > 0.7       | 🚫 `blocked`  |

### Fallback Behavior

If the AI API is unreachable, the system defaults to `review` with a probability of `0.5` — ensuring no transactions are silently dropped.

---

## ⚙️ Feature Engineering (8 Features)

Computed by `FeatureEngineeringService` before calling the AI API:

| Feature                    | Definition                                |
| -------------------------- | ----------------------------------------- |
| `amount_ratio`             | Current amount ÷ user's average amount    |
| `Hour`                     | Hour of transaction (0–23)                |
| `is_foreign`               | 1 if tx country ≠ merchant country        |
| `user_degree`              | Distinct merchants used by this customer  |
| `merchant_degree`          | Distinct customers at this merchant       |
| `MCC`                      | Merchant Category Code                    |
| `User_Frequency_Per_Day`   | Transaction count today for this user     |
| `Time_Difference_Hours`    | Hours since customer's last transaction   |

---

## 💳 Subscription Plans

| Plan         | Limit            | Price         |
| ------------ | ---------------- | ------------- |
| **Starter**  | 5,000 tx/month   | EGP 299/mo    |
| **Business** | 25,000 tx/month  | EGP 999/mo    |
| **Enterprise** | Unlimited      | EGP 2,999/mo  |

Transaction limits are enforced at the API level — requests beyond the limit return `429 Too Many Requests`.

---

## 🐳 Docker Services

The `docker-compose.yml` provisions the following:

| Service            | Image                              | Port(s)          |
| ------------------ | ---------------------------------- | ---------------- |
| **SQL Server**     | `mcr.microsoft.com/mssql/server:2022` | `1433`        |
| **Zookeeper**      | `confluentinc/cp-zookeeper:7.6.0`  | `2181` (internal)|
| **Kafka**          | `confluentinc/cp-kafka:7.6.0`      | `29092`          |
| **Redis**          | `redis:7-alpine`                   | `6379`           |
| **AegisRadar API** | Custom Dockerfile                  | `5000`           |
| **AegisRadar Worker** | Custom Dockerfile               | — (internal)     |

---

## 🧪 Running Tests

```bash
# Unit tests
dotnet test tests/AegisRadar.UnitTests/

# Integration tests
dotnet test tests/AegisRadar.IntegrationTests/

# All tests
dotnet test
```

---

## 🔒 Security

- **JWT Authentication** — All dashboard/merchant endpoints require a valid bearer token
- **API Key Authentication** — Transaction submission uses `X-API-Key` header for merchant identification
- **Rate Limiting** — Fixed window: 100 requests/minute per client
- **CORS** — Configurable origin policy
- **Password Hashing** — SHA-256 hashed passwords
- **Structured Logging** — Serilog with daily log rotation (no secrets logged)

---

## 🛠️ Configuration Reference

### `appsettings.json`

```jsonc
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...",   // SQL Server connection
    "Redis": "localhost:6379"            // Redis connection
  },
  "Jwt": {
    "Secret": "...",                     // Signing key (min 32 chars)
    "Issuer": "AegisRadar",
    "Audience": "AegisRadarClients",
    "ExpiryHours": 8
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "GroupId": "aegisradar-worker",
    "TransactionsTopic": "aegis-transactions"
  },
  "AiService": {
    "BaseUrl": "http://your-ai-api-host",
    "PredictEndpoint": "/predict"
  }
}
```

### Environment Variables (`.env`)

| Variable                  | Description                              |
| ------------------------- | ---------------------------------------- |
| `SQL_PASSWORD`            | SQL Server SA password                   |
| `JWT_SECRET`              | JWT signing secret (min 32 characters)   |
| `AI_API_URL`              | Base URL of external AI prediction API   |
| `AI_API_PREDICT_ENDPOINT` | Prediction endpoint path (default `/predict`) |

---

## 📝 License

This project was developed as a **Graduation Project**.
# AgiesRadarBackEnd
