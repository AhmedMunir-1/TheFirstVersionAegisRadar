# AegisRadar — AI Agent Fix Prompt

## Project Overview

AegisRadar is a beginner-level SaaS fraud detection platform. Merchants register, and after login the dashboard auto-generates live transactions every 1 second through the full pipeline. Each transaction flows through Kafka, gets 8 ML features computed from the DB, gets scored by a FastAPI XGBoost model, and the result is saved to SQL Server and pushed live to the dashboard via SignalR.

The stack is:
- **Backend**: .NET 8, Clean Architecture (Domain / Application / Infrastructure / API layers)
- **Database**: SQL Server (EF Core, no raw SQL)
- **Message broker**: Kafka (one topic: `aegis-transactions`)
- **ML service**: Python FastAPI + XGBoost `.pkl` model
- **Real-time**: SignalR hub at `/hubs/fraud-alerts`
- **Worker**: .NET `BackgroundService` that consumes Kafka

Keep all fixes as simple as possible. This is a beginner-level project — no complex patterns, no over-engineering.

---

## Project Structure (files that exist)

```
src/
├── AegisRadar.Domain/
│   └── Entities/
│       ├── BaseEntity.cs          ✓ exists
│       ├── Alert.cs               ✓ exists
│       └── Merchant.cs            ✗ FILE IS EMPTY — 0 bytes
│
├── AegisRadar.Application/
│   ├── DTOs/
│   │   ├── TransactionDtos.cs     ✓ exists
│   │   ├── DashboardDtos.cs       ✓ exists
│   │   ├── FraudFeatureDtos.cs    ✓ exists
│   │   ├── AuthDtos.cs            ✓ exists
│   │   ├── PaymentResponseDto.cs  ✓ exists
│   │   ├── CreatePaymentDto.cs    ✓ exists
│   │   └── ProcessPaymentDto.cs   ✓ exists
│   ├── Interfaces/
│   │   ├── IFeatureEngineeringService.cs  ✓ exists (no implementation)
│   │   ├── IFraudDetectionService.cs      ✓ exists (no implementation)
│   │   ├── IDemoTransactionGenerator.cs   ✓ exists (no implementation)
│   │   ├── IKafkaProducer.cs              ✓ exists
│   │   ├── INotificationService.cs        ✓ exists
│   │   ├── ICacheService.cs               ✓ exists
│   │   ├── ITokenService.cs               ✓ exists
│   │   └── IEmailService.cs               ✓ exists
│   └── Features/
│       ├── Auth/Commands/AuthCommands.cs          ✓ exists
│       ├── Transactions/Commands/SubmitTransactionCommand.cs  ✓ exists
│       ├── Transactions/Queries/GetTransactionsQuery.cs       ✓ exists
│       ├── Dashboard/Queries/GetDashboardStatsQuery.cs        ✓ exists
│       ├── Alerts/Commands/MarkAlertReadCommand.cs            ✓ exists
│       ├── Alerts/Queries/GetAlertsQuery.cs                   ✓ exists
│       └── Payments/...                                       ✓ exists
│
├── AegisRadar.API/
│   ├── Controllers/
│   │   ├── AuthController.cs          ✓ exists
│   │   ├── TransactionsController.cs  ✓ exists — has POST /api/transactions/generate-demo
│   │   ├── DashboardController.cs     ✓ exists
│   │   ├── AlertsController.cs        ✓ exists
│   │   ├── MerchantsController.cs     ✓ exists
│   │   └── PaymentsController.cs      ✓ exists
│   ├── Hubs/FraudAlertHub.cs          ✓ exists — has HubNotificationService
│   ├── Middleware/Middlewares.cs       ✓ exists
│   └── Program.cs                     ✓ exists
│
├── AegisRadar.Infrastructure/         ✗ ENTIRE FOLDER MISSING from ZIP
│                                        (referenced in Program.cs via AddInfrastructure())
│
├── AegisRadar.Shared/                 ✗ ENTIRE PROJECT MISSING from ZIP
│                                        (referenced by Application and API)
│
├── AegisRadar.Worker/                 ✗ PROJECT IN SOLUTION BUT NO SOURCE FILES
│
└── AegisRadar.AiService/   ✗ REMOVE from .sln — see note below
    └── ml_service/
        ├── main.py         ✓ correct source code
        ├── predict.py      ✓ correct source code
        ├── model_loader.py ✓ correct source code
        ├── consumer.py     — standalone demo script only
        └── producer.py     — standalone demo script only
```

**Note on AegisRadar.AiService:** This is a Python project inside a .NET solution, which causes build errors and confusion. It runs as a standalone Docker container on `localhost:8001`. Remove it from the solution file:
```bash
dotnet sln remove src/AegisRadar.AiService
```
Then move the folder outside the .NET solution to a sibling directory called `ml-service/`. The .NET backend communicates with it only via `HttpClient` using the URL configured in `appsettings.json`:
```json
"AiService": {
  "BaseUrl": "http://localhost:8001",
  "PredictEndpoint": "/predict"
}
```
No code changes needed in the .NET projects — only the folder location and solution reference change.

---

## What the finished system must do (user story)

1. Merchant opens the app and registers with email + password
2. An email verification code is sent → merchant verifies → lands on dashboard
3. **Immediately on first login**, the system starts auto-generating transactions, one every 1 second, going through the full pipeline:

```
.NET API  →  Kafka topic "aegis-transactions"
    ↓
.NET Worker consumes the event
    ↓
Worker queries SQL Server to compute 8 ML features
    ↓
Worker POSTs 8 features to FastAPI /predict
    ↓
FastAPI returns { fraud_probability, decision }
    ↓
Worker saves Transaction + FraudPrediction to SQL Server
    ↓
Worker pushes update to SignalR → dashboard refreshes live
    ↓
If decision = "Review" → Alert is created → admin sees it in dashboard
```

4. Dashboard shows live stats, recent transactions, fraud trend chart — all from DB
5. Admin sees flagged ("Review") transactions with full details (amount, customer, probability, all 8 feature values)
6. Admin clicks Approve or Block → status is updated in DB → dashboard reflects it live
7. No generate button needed — generation is automatic and continuous after login

---

## Bugs and missing pieces to fix — in priority order

### CRITICAL — project cannot compile

**1. `Merchant.cs` entity is an empty file**
File: `src/AegisRadar.Domain/Entities/Merchant.cs`
Write the full entity class. Properties needed (read from how they are used across the codebase):
- `Id` (Guid, from BaseEntity)
- `CompanyName` (string)
- `Email` (string)
- `PasswordHash` (string) — SHA-256 hex, always 64 chars
- `Country` (string) — ISO 2-letter
- `ApiKey` (string) — generated as `"ar_" + hex(16 random bytes)`
- `Role` (string) — default `"Admin"`
- `IsEmailConfirmed` (bool)
- `EmailVerificationCode` (string?)
- `EmailVerificationExpires` (DateTime?)
- `PasswordResetCode` (string?)
- `PasswordResetExpires` (DateTime?)
- `PlanId` (Guid?)
- `HasPaymentMethod` (bool)
- `TrialStartDate` (DateTime?)
- `TrialEndDate` (DateTime?)
- `IsTrialActive` — computed property, NOT a DB column: `=> TrialEndDate.HasValue && TrialEndDate.Value > DateTime.UtcNow`
- Navigation: `Plan` (SubscriptionPlan?), `Transactions` (ICollection), `Alerts` (ICollection), `Payments` (ICollection)

**2. `AegisRadar.Shared` project is missing entirely**
Create the project at `src/AegisRadar.Shared/` with these simple classes:

`Events/TransactionCreatedEvent.cs` — plain C# record:
```
TransactionId, MerchantId, CustomerId, Amount, Currency,
TransactionCountry, MerchantCountry, Mcc, DeviceId, IpAddress, CreatedAt
```

`Constants/CacheKeys.cs` — static methods returning strings:
```
MerchantByApiKey(string apiKey)  →  "merchant:apikey:{apiKey}"
DashboardStats(Guid id)          →  "dashboard:stats:{id}"
FraudTrends(Guid id)             →  "dashboard:trends:{id}"
```

`Constants/SignalRMethods.cs` — string constants:
```
FraudAlertReceived = "FraudAlertReceived"
DashboardRefresh   = "DashboardRefresh"
TransactionUpdated = "TransactionUpdated"
```

**3. `AegisRadar.Infrastructure` project is missing entirely**
Create the project at `src/AegisRadar.Infrastructure/`. It must implement:
- `AegisDbContext` (EF Core DbContext) — see DB schema section below
- `UnitOfWork` implementing `IUnitOfWork`
- All repositories: `TransactionRepository`, `MerchantRepository`, `AlertRepository`, `FraudPredictionRepository`, `PaymentRepository`
- `FeatureEngineeringService` implementing `IFeatureEngineeringService`
- `FraudDetectionService` implementing `IFraudDetectionService` (HTTP client calling FastAPI)
- `DemoTransactionGeneratorService` implementing `IDemoTransactionGenerator`
- `KafkaProducer` implementing `IKafkaProducer`
- `NotificationService` implementing `INotificationService` (wraps `HubNotificationService`)
- `CacheService` implementing `ICacheService` (Redis via `IConnectionMultiplexer`)
- `InfrastructureServiceExtensions` with `AddInfrastructure(IConfiguration)` extension method

**4. `AegisRadar.Worker` project is missing entirely**
Create the project at `src/AegisRadar.Worker/`. It needs only one file:
`Workers/FraudDetectionWorker.cs` — a `BackgroundService` that:
- Subscribes to Kafka topic `aegis-transactions`
- For each message: calls `IFeatureEngineeringService.ComputeFeaturesAsync()`, calls `IFraudDetectionService.PredictAsync()`, saves the result, sends SignalR notification
- Processes one message at a time, commits offset after successful save
- Uses `await Task.Delay(1000)` between each transaction to give the dashboard time to visualize it

---

### DB SCHEMA — what tables and columns must exist

Use EF Core `OnModelCreating` to define everything. Keep it simple.

**Transactions**
```
Id               uniqueidentifier  PK
MerchantId       uniqueidentifier  FK → Merchants
CustomerId       nvarchar(100)
Amount           decimal(18,4)
Currency         nchar(3)
Country          nvarchar(2)        ← transaction country
MerchantCountry  nvarchar(2)        ← ADD THIS — needed for is_foreign feature
Mcc              int
DeviceId         nvarchar(100)
IpAddress        nvarchar(45)
Status           int               0=Pending 1=Approved 2=Review 3=Blocked
CreatedAt        datetime2
```

**FraudPredictions** (1-to-1 with Transactions)
```
Id               uniqueidentifier  PK
TransactionId    uniqueidentifier  FK → Transactions  UNIQUE
FraudProbability float
Decision         int               0=Approved 1=Review 2=Blocked
ModelVersion     nvarchar(20)
-- 7 features (for audit and dashboard detail view)
AmountRatio      float
Hour             int
IsForeign        int
UserDegree       int
MerchantDegree   int
UserFreqPerDay   int
TimeDiffHours    float
-- admin review fields
AdminOverride    bit               default 0
AdminNote        nvarchar(500)     null
ReviewedAt       datetime2         null
CreatedAt        datetime2
```

**Merchants**
```
Id                          uniqueidentifier  PK
CompanyName                 nvarchar(200)
Email                       nvarchar(200)     UNIQUE INDEX
PasswordHash                nchar(64)
Country                     nchar(2)
ApiKey                      nvarchar(50)      UNIQUE INDEX
Role                        nvarchar(20)      default 'Admin'
IsEmailConfirmed            bit               default 0
EmailVerificationCode       nvarchar(6)       null
EmailVerificationExpires    datetime2         null
PasswordResetCode           nvarchar(6)       null
PasswordResetExpires        datetime2         null
PlanId                      uniqueidentifier  null  FK → SubscriptionPlans
HasPaymentMethod            bit               default 0
TrialStartDate              datetime2         null
TrialEndDate                datetime2         null
-- DO NOT add IsTrialActive column — it is a computed C# property only
CreatedAt                   datetime2
```

**Alerts**
```
Id             uniqueidentifier  PK
MerchantId     uniqueidentifier  FK → Merchants
TransactionId  uniqueidentifier  FK → Transactions
Severity       int               0=Low 1=Medium 2=High 3=Critical
Message        nvarchar(500)
IsRead         bit               default 0
CreatedAt      datetime2
```

**SubscriptionPlans**
```
Id                uniqueidentifier  PK
Name              nvarchar(50)
MonthlyPrice      decimal(10,2)
TransactionLimit  int               -1 = unlimited
CreatedAt         datetime2
```

**Payments** (billing only — remove fraud columns)
```
Id                    uniqueidentifier  PK
MerchantId            uniqueidentifier  FK → Merchants
PlanId                uniqueidentifier  FK → SubscriptionPlans
Amount                decimal(10,2)
Status                int
TransactionReference  nvarchar(100)     null
PeriodStartDate       datetime2
PeriodEndDate         datetime2
ProcessedAt           datetime2         null
CreatedAt             datetime2
-- REMOVE: IsFraudDetected, FraudScore — wrong table
```

---

### BUGS to fix in existing files

**5. `GetDashboardStatsQuery.cs` — performance bug**
Currently loads 10,000 rows into memory with `.Where()` in C#.
Fix: Add a dedicated DB query method on the repository that uses EF Core `.Where()` and `.Count()` directly against `IQueryable<Transaction>` — let the SQL do the filtering.
The repository method signature: `Task<DashboardAggregate> GetDailyStatsAsync(Guid merchantId, DateTime date, CancellationToken ct)`
Where `DashboardAggregate` is a simple record with: `TotalCount, ApprovedCount, ReviewCount, BlockedCount, TotalVolume, AvgFraudProbability`.
Same fix for `GetFraudTrendsQuery` which currently loads 100,000 rows — add `GetFraudTrendsAsync(Guid merchantId, int days, CancellationToken ct)` that groups by date in SQL.

**6. `ApiKeyMiddleware.cs` — cache bug**
On cache hit, `MerchantCountry` is hardcoded to `"EG"` and `PlanLimit` to `5000` for every merchant.
Fix: Cache a small object `{ MerchantId, Country, PlanLimit }` serialized as JSON instead of just the `merchantId` string. Deserialize it on cache hit.

**7. `AuthCommands.cs` — `VerifyEmailCommandHandler` missing demo start**
After email verification, the merchant gets their JWT but the demo generator is never called.
Fix: Inject `IDemoTransactionGenerator` into `VerifyEmailCommandHandler` and call `GenerateTransactionsForMerchantAsync` after saving the verified merchant — same as `LoginCommandHandler` already does.

**8. `Random` used for security codes**
In `RegisterMerchantCommandHandler` and `ForgotPasswordCommandHandler`, verification codes use `new Random().Next(100000, 999999)`.
Fix: Replace with `RandomNumberGenerator.GetInt32(100000, 1000000)` — one line change in each handler.

**9. `PaymentResponseDto.cs` and `Payment` entity — wrong fraud fields**
`PaymentResponseDto` has `IsFraudDetected` and `FraudScore`. Remove them from the DTO and from the `Payment` entity. Fraud lives on `FraudPredictions`, not on billing payments.
Also fix `InitiatePaymentHandler` and `ProcessPaymentHandler` which set `payment.IsFraudDetected` and `payment.FraudScore`.

**10. Running FastAPI Docker container is out of sync with the source code — `Card` vs `user_degree`**
The `main.py` source code defines the `Transaction` Pydantic model with `user_degree: int` as the 8th field, and `predict.py` `FEATURE_COLUMNS` also lists `user_degree`. This is correct and does NOT need to change.

However, the currently running Docker container on `localhost:8001` shows `Card` in its Swagger schema instead of `user_degree` — meaning the Docker image was built from an older version of `main.py`. Rebuild the Docker image from the correct source:
```bash
docker build -t aegis-ml-service ./ml-service
docker run -p 8001:8001 aegis-ml-service
```
After rebuild, `GET /model-info` should return `user_degree` in the features list. The `.NET` `FraudDetectionService` must send `user_degree` in the JSON body — which already matches the source code.

**11. `consumer.py` — saves nothing to DB after prediction**
After getting the result from FastAPI, the Python consumer only publishes to another Kafka topic and prints to console. The result never reaches the SQL Server DB.
Decision: The Python consumer.py is a standalone demo script, not part of the main pipeline. The `.NET Worker` is responsible for calling FastAPI and saving to DB. Remove the `producer.send('predictions.results', ...)` line from consumer.py and add a comment explaining this.

**12. `producer.py` — sends raw transaction fields not computed features**
The producer sends raw data (amount, currency, deviceId) but the consumer tries to read computed features (amount_ratio, user_degree, etc.) directly from the Kafka message.
Decision: The Python producer.py is also a standalone demo script. Mark it clearly with a comment that it is for demonstration only and does not compute real ML features — the real feature computation happens in the .NET Worker by querying the DB.

---

### MISSING FEATURES to add

**13. `IFeatureEngineeringService` implementation**
Create `src/AegisRadar.Infrastructure/Services/FeatureEngineeringService.cs`.
Compute each of the 8 features from the DB:

- `amount_ratio` = `amount / average(all past amounts for this customerId)` — if no history, use 1.0
- `Hour` = `transactionTime.Hour`
- `is_foreign` = `transactionCountry != merchantCountry ? 1 : 0`
- `user_degree` = count of distinct `MerchantId` values in Transactions for this `customerId`
- `merchant_degree` = count of distinct `CustomerId` values in Transactions for this `merchantId`
- `MCC` = passed directly from the transaction, no computation
- `User_Frequency_Per_Day` = count of transactions by this `customerId` today (same calendar date as `transactionTime`)
- `Time_Difference_Hours` = hours between `transactionTime` and the most recent previous transaction by this `customerId` — if none, use 24.0

Run the 4 DB queries in parallel using `Task.WhenAll`.

**14. `IFraudDetectionService` implementation**
Create `src/AegisRadar.Infrastructure/Services/FraudDetectionService.cs`.
Simple `HttpClient` POST to `{AiService:BaseUrl}{AiService:PredictEndpoint}` with the 8 features as JSON.
The FastAPI response is `{ fraud_probability: float, decision: string, model_version: string }`.
Parse `decision` case-insensitively: "approved" → `FraudDecision.Approved`, "review" → `FraudDecision.Review`, "blocked" → `FraudDecision.Blocked`.

**15. `IDemoTransactionGenerator` implementation**
Create `src/AegisRadar.Infrastructure/Services/DemoTransactionGeneratorService.cs`.
On each call to `GenerateTransactionsForMerchantAsync(merchant, count)`:
- Loop `count` times
- Generate a random `TransactionRequestDto` (random customer ID, amount 50–5000, random MCC from [5411,5651,6010,5999,7011], random country from ["EG","US","AE","DE","FR"])
- Call `IKafkaProducer.PublishTransactionCreatedAsync()` with the event
- `await Task.Delay(1000)` between each one — 1 second per transaction
- This method should be called with a high `count` (e.g. 9999) so it just keeps running until the application stops

**16. `FraudDetectionWorker` — the full Kafka consumer**
Create `src/AegisRadar.Worker/Workers/FraudDetectionWorker.cs` as a `BackgroundService`.

On each Kafka message:
1. Deserialize the `TransactionCreatedEvent`
2. Load the `Transaction` from DB by `TransactionId`
3. Call `IFeatureEngineeringService.ComputeFeaturesAsync()`
4. Call `IFraudDetectionService.PredictAsync(features)`
5. Determine new `TransactionStatus`: Approved=1, Review=2, Blocked=3
6. Update `transaction.Status` in DB
7. Save a new `FraudPrediction` row with all 7 features + result
8. If decision is Review or Blocked: save a new `Alert` row
9. Call `SaveChangesAsync()`
10. Push SignalR notifications: `SendTransactionUpdateAsync` + `SendDashboardRefreshAsync` (+ `SendFraudAlertAsync` if Review/Blocked)
11. Commit the Kafka offset
12. On any error: log it and continue — do not crash the worker

**17. Admin review endpoint**
Add `PATCH /api/transactions/{id}/review` to `TransactionsController.cs`.
Request body: `{ "decision": "Approve" | "Block", "note": "optional string" }`
Logic:
1. Load the transaction (check it belongs to the authenticated merchant)
2. Verify `transaction.Status == Review` — if not, return 400 with message "Only Review transactions can be actioned"
3. Set `transaction.Status` to Approved or Blocked
4. If `transaction.Prediction` exists: set `Prediction.Decision`, `Prediction.AdminOverride = true`, `Prediction.AdminNote`, `Prediction.ReviewedAt = DateTime.UtcNow`
5. Save to DB
6. Push SignalR `SendTransactionUpdateAsync` + `SendDashboardRefreshAsync`
7. Return the updated transaction

Add a simple `ReviewDecisionDto` record: `string Decision, string? Note`

---

### SIMPLIFICATION suggestions (flag for user to decide)

The following things in the existing code are over-engineered for a beginner project. You may want to simplify them:

**A. Hangfire** — `Program.cs` uses Hangfire for a daily fraud summary job. For a demo project this adds complexity (needs its own DB schema, separate nuget packages). Consider removing it and running the job as a simple timer inside a `BackgroundService` instead.

**B. MediatR** — every command and query goes through MediatR. For a beginner project this adds indirection. If you want to simplify, you can call service/repository methods directly from controllers instead. Only do this if asked.

**C. FluentValidation** — the `TransactionRequestValidator` is the only validator. For simplicity, data annotations (`[Required]`, `[Range]`) directly on the DTO could replace it. Only do this if asked.

**D. Redis cache** — `ICacheService` wraps Redis. For a demo, an in-memory `IMemoryCache` (built into .NET, no extra dependencies) would work fine and remove the Redis dependency. Only change this if asked.

**E. `MarkAllRead` in `AlertsController`** — currently loops and sends one MediatR command per alert. Simpler: add a `MarkAllAlertsReadAsync(Guid merchantId)` method to `IAlertRepository` and call it once.

---

### Naming consistency fixes

The ML feature names must exactly match what the FastAPI `/predict` endpoint expects. Verified from the live `localhost:8001` Swagger schema and the `main.py` source code:

| C# DTO property       | JSON key sent to FastAPI (exact) | FastAPI Pydantic field  | Confirmed |
|-----------------------|----------------------------------|-------------------------|-----------|
| `AmountRatio`         | `amount_ratio`                   | `amount_ratio`          | ✓         |
| `Hour`                | `Hour`                           | `Hour`                  | ✓         |
| `IsForeign`           | `is_foreign`                     | `is_foreign`            | ✓         |
| `UserDegree`          | `user_degree`                    | `user_degree`           | ✓ (source code — not `Card`) |
| `MerchantDegree`      | `merchant_degree`                | `merchant_degree`       | ✓         |
| `MCC`                 | `MCC`                            | `MCC`                   | ✓         |
| `UserFrequencyPerDay` | `User_Frequency_Per_Day`         | `User_Frequency_Per_Day`| ✓         |
| `TimeDifferenceHours` | `Time_Difference_Hours`          | `Time_Difference_Hours` | ✓         |

**Important:** The running `localhost:8001` instance currently shows `Card` in its Swagger UI for the 8th field. This is because an old version of `main.py` is running. The source code already has `user_degree`. Restart the FastAPI process before testing — do not add `Card` to the C# code.

Use `[JsonPropertyName("...")]` on the `FraudFeaturePayloadDto` properties so C# serializes them with the exact key names FastAPI expects. Example:
```csharp
[JsonPropertyName("user_degree")]
public int UserDegree { get; set; }

[JsonPropertyName("User_Frequency_Per_Day")]
public int UserFrequencyPerDay { get; set; }

[JsonPropertyName("Time_Difference_Hours")]
public double TimeDifferenceHours { get; set; }
```

---

### Required DB indexes (add in `OnModelCreating`)

```csharp
// For feature engineering queries — runs on every transaction
entity.HasIndex(t => new { t.CustomerId, t.MerchantId });
entity.HasIndex(t => new { t.MerchantId, t.CustomerId });
entity.HasIndex(t => new { t.CustomerId, t.CreatedAt });

// For dashboard queries
entity.HasIndex(t => new { t.MerchantId, t.Status, t.CreatedAt });

// For alerts unread count
entity.HasIndex(a => new { a.MerchantId, a.IsRead });
```

---

### Expected behavior after all fixes

1. Run SQL Server, Kafka, Redis, FastAPI, .NET API, .NET Worker — all start without errors
2. Register → verify email → JWT issued
3. Within 1 second of getting the JWT, the demo generator starts producing 1 transaction per second
4. Each transaction: saved to DB → Kafka event → Worker picks it up → features computed → FastAPI called → result saved → SignalR push → dashboard updates
5. Dashboard shows live counts, fraud probability trend, recent transactions list — all from DB queries
6. Transactions with `Status = Review` appear in the review queue with all 8 feature values visible
7. Admin clicks Approve or Block → PATCH request → DB updated → dashboard reflects new status within 1 second
8. All data persists across page refresh (it comes from DB, not memory)

---

## Controller & Endpoint Audit (from reading every controller file)

### Complete API surface — all endpoints that exist

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | `/api/auth/register` | none | Returns merchant ID + message |
| POST | `/api/auth/login` | none | Returns JWT |
| POST | `/api/auth/verify` | none | Returns JWT after email code |
| POST | `/api/auth/forgot-password` | none | Sends reset code |
| POST | `/api/auth/reset-password` | none | Updates password |
| POST | `/api/transactions` | X-API-Key header | Submit transaction → Kafka |
| GET | `/api/transactions` | JWT | Paginated list |
| GET | `/api/transactions/{id}` | JWT | Single tx with prediction |
| POST | `/api/transactions/generate-demo` | JWT | Generate N random transactions |
| GET | `/api/dashboard/stats` | JWT | Today's aggregated stats |
| GET | `/api/dashboard/trends` | JWT | Fraud trend last N days |
| GET | `/api/dashboard/recent` | JWT | Last N transactions |
| GET | `/api/alerts` | JWT | List alerts, optional unreadOnly |
| PUT | `/api/alerts/{id}/read` | JWT | Mark one alert read |
| PUT | `/api/alerts/read-all` | JWT | Mark all alerts read |
| GET | `/api/merchants/me` | JWT | Merchant profile |
| GET | `/api/subscriptions/plans` | none | List subscription plans |
| POST | `/api/payments/initiate` | JWT | Start a subscription payment |
| POST | `/api/payments/process` | JWT | Process a payment |
| GET | `/api/payments/{id}` | JWT | ⚠ always returns 404 — not implemented |
| GET | `/health` | none | Health check |
| WS | `/hubs/fraud-alerts` | JWT (query param) | SignalR hub |

### Endpoint bugs found in controllers

**Bug E1 — `GET /api/payments/{id}` always returns 404**
File: `PaymentsController.cs`
`GetById` is a stub that just returns `NotFound()` with no DB query. The `CreatedAtAction` in `Initiate` points to this broken method. Fix: add a real DB lookup via `_uow.Payments.GetByIdAsync(id, ct)` and return a proper response, or remove the `CreatedAtAction` and just return `Ok(result)` from `Initiate`.

**Bug E2 — `PUT /api/alerts/read-all` is O(N) round trips to the DB**
File: `AlertsController.cs`, `MarkAllRead` action.
It calls `GetAlertsQuery` to fetch all unread alerts, then loops and sends one `MarkAlertReadCommand` per alert — each command is a separate DB read + write. With 100 unread alerts that's 201 DB calls.
Fix: add `MarkAllAlertsReadAsync(Guid merchantId, CancellationToken ct)` to `IAlertRepository` that runs a single `UPDATE Alerts SET IsRead=1 WHERE MerchantId=@id AND IsRead=0`. Call it directly from the controller or a new `MarkAllAlertsReadCommand`.

**Bug E3 — `POST /api/transactions/generate-demo` is excluded from `ApiKeyMiddleware` but still blocked by it**
File: `Middlewares.cs` line: `context.Request.Path.StartsWithSegments("/api/transactions/generate-demo")`
The middleware condition checks `StartsWithSegments` but the route is a POST to `/api/transactions/generate-demo` which also starts with `/api/transactions`. The exclusion path check needs to come **before** the method check, otherwise the order of conditions may match `POST + /api/transactions` before the exclusion is evaluated. Verify the short-circuit order:
```csharp
// Current (might be evaluated wrong):
if (!context.Request.Path.StartsWithSegments("/api/transactions") ||
     context.Request.Method != "POST" ||
     context.Request.Path.StartsWithSegments("/api/transactions/generate-demo"))

// Safe explicit version:
var isTransactionSubmit = context.Request.Method == "POST"
    && context.Request.Path.StartsWithSegments("/api/transactions")
    && !context.Request.Path.StartsWithSegments("/api/transactions/generate-demo");

if (!isTransactionSubmit) { await _next(context); return; }
```

**Bug E4 — `SubmitTransactionCommand` does not save `MerchantCountry` to the Transaction row**
File: `SubmitTransactionCommand.cs`
The transaction entity is saved without `MerchantCountry`. The value exists in `command.MerchantCountry` (passed from middleware) but it is only copied into the Kafka event, not into the `Transaction` DB row. When the Worker later needs to recheck `is_foreign`, or the admin view needs to show it, it is lost.
Fix: add `MerchantCountry = command.MerchantCountry` to the `Transaction` object initializer before `AddAsync`.

**Bug E5 — `LoginCommandHandler` only generates 5 demo transactions on every login**
File: `AuthCommands.cs`, `TryGenerateDemoTransactionsAsync`
`GenerateTransactionsForMerchantAsync(merchant, 5, ...)` — generates only 5 and stops. The goal is continuous generation at 1/sec. Fix: change `count` to a large number like `9999` so the generator keeps running for the session. The generator should use `await Task.Delay(1000)` between each transaction so one is produced per second.

**Bug E6 — `VerifyEmailCommandHandler` does not start the demo generator**
File: `AuthCommands.cs`, `VerifyEmailCommandHandler`
After email verification the merchant gets their JWT but `IDemoTransactionGenerator` is never called. A new merchant who just registered will land on an empty dashboard. `LoginCommandHandler` calls it, but a first-time user goes through Register → Verify, never Login.
Fix: inject `IDemoTransactionGenerator` into `VerifyEmailCommandHandler` and call it the same way as `LoginCommandHandler`.

**Bug E7 — `SubscriptionsController.GetPlans` calls wrong repository method**
File: `MerchantsController.cs` (both controllers are in the same file)
```csharp
var plans = await _uow.Merchants.GetAllAsync(ct); // this fetches Merchants, not Plans!
```
The method fetches merchants but the result is thrown away and hardcoded plan data is returned instead. This means the method compiles and runs but fetches unnecessary data. Fix: remove the `GetAllAsync` call entirely — the hardcoded plans below it are fine for now, or add a `GetAllPlansAsync` method to the repository and seed the DB.

**Bug E8 — `MerchantsController.GetMe` accesses `merchant.IsTrialActive` as a DB column**
File: `MerchantsController.cs`
`merchant.IsTrialActive` is referenced in the anonymous object returned by `/api/merchants/me`. Once `IsTrialActive` is changed to a computed property (not a DB column), this call remains correct — the computed property just evaluates `TrialEndDate > DateTime.UtcNow`. No code change needed here, but confirm EF Core `Ignore()` is set so it does not try to map it to a column.

**Missing endpoint — `PATCH /api/transactions/{id}/review`**
This is the admin decision endpoint described in the main fix list above (item 17). It does not exist in `TransactionsController.cs`. It must be added.

### Controller logic issues (not endpoint-level)

**Logic issue L1 — `GetDashboardStatsHandler` caches for 30 seconds but live updates via SignalR tell the frontend to refresh immediately**
When the Worker pushes `DashboardRefresh` via SignalR, the frontend calls `GET /api/dashboard/stats`. But the cache returns stale data for up to 30 seconds. Fix: when the Worker saves a prediction and fires SignalR, it should also invalidate the cache keys for that merchant:
```csharp
await _cache.RemoveAsync(CacheKeys.DashboardStats(merchantId));
await _cache.RemoveAsync(CacheKeys.FraudTrends(merchantId));
```
This means add a `RemoveAsync(string key)` method to `ICacheService` if it does not exist.

**Logic issue L2 — `GetDashboardStatsHandler` divides by `txToday == 0 ? 1 : txToday` but this produces 0% approval rate when there are no transactions**
```csharp
var total = txToday == 0 ? 1 : txToday; // avoids divide-by-zero but returns 0/1 = 0% approval
Math.Round((double)approved / total * 100, 1)  // returns 0.0 when total is 1 (the sentinel)
```
Fix: if `txToday == 0` return `approvalRate = 100.0` (no transactions = no fraud) instead of dividing.

**Logic issue L3 — `PredictionResponseDto` in `GetById` uses wrong property names**
File: `TransactionsController.cs`, `GetById` action.
The `PredictionResponseDto` constructor is called with positional args. If the record definition order ever changes, this silently maps wrong values. Use named arguments. Also: `GetById` does not include the 7 feature values (AmountRatio, Hour, etc.) in the response even though they will exist in the DB after the fix — the admin review modal needs them to show the full transaction detail.
Fix: extend `PredictionResponseDto` to include the 7 feature values, and populate them from `tx.Prediction` in `GetById`.
