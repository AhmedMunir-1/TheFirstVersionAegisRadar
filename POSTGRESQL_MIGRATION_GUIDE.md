# PostgreSQL Migration Guide for AegisRadar

> Migrate from SQL Server to PostgreSQL for free cloud deployment (Railway.app)

---

## 📋 What Changes

| Layer | From | To |
|-------|------|-----|
| **Database** | SQL Server 2022 | PostgreSQL 15 |
| **NuGet** | Microsoft.EntityFrameworkCore.SqlServer | Npgsql.EntityFrameworkCore.PostgreSQL |
| **Connection String** | `Server=...;Database=...;User Id=sa;Password=...` | `Host=...;Database=...;Username=...;Password=...` |
| **EF Core Method** | `UseSqlServer()` | `UseNpgsql()` |

---

## ✅ Step 1: Install PostgreSQL NuGet Package

```bash
cd /Users/ahmed/Desktop/00-GradutionProjectWork/AegisRadarBackend

# Remove SQL Server package
dotnet remove package Microsoft.EntityFrameworkCore.SqlServer \
  --project ./src/AegisRadar.Infrastructure

# Add PostgreSQL package
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL \
  --project ./src/AegisRadar.Infrastructure

# Also add Hangfire PostgreSQL support
dotnet add package Hangfire.PostgreSql \
  --project ./src/AegisRadar.Infrastructure
```

---

## ✅ Step 2: Update DbContext Configuration

**File:** `src/AegisRadar.Infrastructure/InfrastructureServiceRegistration.cs`

Change from SQL Server to PostgreSQL:

```csharp
// OLD (SQL Server):
services.AddDbContext<AegisRadarDbContext>(options =>
    options.UseSqlServer(
        configuration.GetConnectionString("DefaultConnection"),
        sql => sql.MigrationsAssembly(typeof(AegisRadarDbContext).Assembly.FullName)));

// NEW (PostgreSQL):
services.AddDbContext<AegisRadarDbContext>(options =>
    options.UseNpgsql(
        configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.MigrationsAssembly(typeof(AegisRadarDbContext).Assembly.FullName)));
```

Also update Hangfire configuration:

```csharp
// OLD (SQL Server):
services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection"),
        new SqlServerStorageOptions { ... }));

// NEW (PostgreSQL):
services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(configuration.GetConnectionString("DefaultConnection")));
```

---

## ✅ Step 3: Update Configuration Files

### Development - `appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=AegisRadarDB;Username=postgres;Password=postgres;",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "Secret": "AegisRadar_Dev_Secret_Key_Change_In_Production_32ch!!",
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
    "BaseUrl": "http://localhost:8000",
    "PredictEndpoint": "/predict"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information"
    }
  }
}
```

### Production - `appsettings.Production.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=${DATABASE_HOST};Port=${DATABASE_PORT};Database=${DATABASE_NAME};Username=${DATABASE_USER};Password=${DATABASE_PASSWORD};SSL Mode=Require;",
    "Redis": "${REDIS_URL}"
  },
  "Jwt": {
    "Secret": "${JWT_SECRET}",
    "Issuer": "AegisRadar",
    "Audience": "AegisRadarClients",
    "ExpiryHours": 8
  },
  "Kafka": {
    "BootstrapServers": "${KAFKA_BOOTSTRAP_SERVERS}",
    "GroupId": "aegisradar-worker",
    "TransactionsTopic": "aegis-transactions"
  },
  "AiService": {
    "BaseUrl": "${AI_SERVICE_BASE_URL}",
    "PredictEndpoint": "/predict"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information"
    }
  }
}
```

---

## ✅ Step 4: Create New Migration

Remove old SQL Server migration and create new one for PostgreSQL:

```bash
cd /Users/ahmed/Desktop/00-GradutionProjectWork/AegisRadarBackend

# Remove old migrations
rm -rf src/AegisRadar.Infrastructure/Persistence/Migrations/

# Create new PostgreSQL migration
dotnet ef migrations add InitialCreate \
  --project ./src/AegisRadar.Infrastructure \
  --startup-project ./src/AegisRadar.API

# Build to verify
dotnet build

# Update database (local PostgreSQL)
dotnet ef database update \
  --project ./src/AegisRadar.Infrastructure \
  --startup-project ./src/AegisRadar.API
```

---

## ✅ Step 5: Update Docker Compose

**File:** `docker-compose.yml`

Replace SQL Server with PostgreSQL:

```yaml
version: '3.8'

services:
  # ── PostgreSQL (instead of SQL Server) ─────────────────────────────
  postgres:
    image: postgres:15-alpine
    container_name: aegis-postgres
    environment:
      POSTGRES_DB: AegisRadarDB
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_USER: ${DB_USER:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - aegis-network

  # ── Zookeeper ──────────────────────────────────────────────────────
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    container_name: aegis-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
      - zookeeper_log:/var/lib/zookeeper/log
    healthcheck:
      test: echo ruok | nc localhost 2181 | grep imok
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - aegis-network

  # ── Kafka ──────────────────────────────────────────────────────────
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: aegis-kafka
    depends_on:
      zookeeper:
        condition: service_healthy
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    ports:
      - "29092:29092"
    volumes:
      - kafka_data:/var/lib/kafka/data
    healthcheck:
      test: kafka-topics --bootstrap-server kafka:9092 --list
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 30s
    networks:
      - aegis-network

  # ── Redis ──────────────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: aegis-redis
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: redis-cli ping
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - aegis-network

  # ── AegisRadar API ─────────────────────────────────────────────────
  aegisradar-api:
    build:
      context: .
      dockerfile: src/AegisRadar.API/Dockerfile
    container_name: aegis-api
    depends_on:
      postgres:
        condition: service_healthy
      kafka:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ASPNETCORE_URLS: http://+:5099
      ConnectionStrings__DefaultConnection: "Host=postgres,5432;Database=AegisRadarDB;Username=${DB_USER:-postgres};Password=${DB_PASSWORD:-postgres};"
      ConnectionStrings__Redis: "redis:6379"
      Jwt__Secret: "${JWT_SECRET:-AegisRadar_Dev_Secret_32ch!!}"
      Jwt__Issuer: "AegisRadar"
      Jwt__Audience: "AegisRadarClients"
      Kafka__BootstrapServers: "kafka:9092"
      Kafka__TransactionsTopic: "aegis-transactions"
      AiService__BaseUrl: "${AI_API_URL:-http://localhost:8000}"
      AiService__PredictEndpoint: "${AI_API_PREDICT_ENDPOINT:-/predict}"
    ports:
      - "5099:5099"
    healthcheck:
      test: curl -f http://localhost:5099/health || exit 1
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - aegis-network
    restart: unless-stopped

  # ── Worker Service (Kafka Consumer) ────────────────────────────────
  aegisradar-worker:
    build:
      context: .
      dockerfile: src/AegisRadar.Worker/Dockerfile
    container_name: aegis-worker
    depends_on:
      aegisradar-api:
        condition: service_healthy
      kafka:
        condition: service_healthy
    environment:
      ConnectionStrings__DefaultConnection: "Host=postgres,5432;Database=AegisRadarDB;Username=${DB_USER:-postgres};Password=${DB_PASSWORD:-postgres};"
      ConnectionStrings__Redis: "redis:6379"
      Jwt__Secret: "${JWT_SECRET:-AegisRadar_Dev_Secret_32ch!!}"
      Kafka__BootstrapServers: "kafka:9092"
      Kafka__TransactionsTopic: "aegis-transactions"
      AiService__BaseUrl: "${AI_API_URL:-http://localhost:8000}"
      AiService__PredictEndpoint: "${AI_API_PREDICT_ENDPOINT:-/predict}"
      SignalR__HubUrl: "http://aegisradar-api:5099/hubs/fraud-alerts"
    networks:
      - aegis-network
    restart: unless-stopped

networks:
  aegis-network:
    driver: bridge

volumes:
  postgres_data:
  zookeeper_data:
  zookeeper_log:
  kafka_data:
  redis_data:
```

---

## ✅ Step 6: Test Locally

```bash
# Start all services with new PostgreSQL
docker-compose up -d

# Run migrations
dotnet ef database update \
  --project ./src/AegisRadar.Infrastructure \
  --startup-project ./src/AegisRadar.API

# Run the API
dotnet watch run --project src/AegisRadar.API/AegisRadar.API.csproj

# Verify at http://localhost:5099/swagger
```

---

## ✅ Step 7: Deploy to Railway

```bash
# 1. Install Railway CLI
brew install railway

# 2. Login
railway login

# 3. Create Railway project
railway init

# 4. Set environment variables
railway variables set DATABASE_HOST=your-railway-db.railway.internal
railway variables set DATABASE_PORT=5432
railway variables set DATABASE_NAME=AegisRadarDB
railway variables set DATABASE_USER=postgres
railway variables set DATABASE_PASSWORD=$(openssl rand -base64 32)
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set ASPNETCORE_ENVIRONMENT=Production

# 5. Deploy
railway up
```

---

## 🔄 Migration Differences

### SQL Server → PostgreSQL

| Feature | SQL Server | PostgreSQL | Notes |
|---------|-----------|-----------|-------|
| **Connection String** | SQL native | libpq format | Different format |
| **Identity (Auto-increment)** | `IDENTITY(1,1)` | `SERIAL` / `BIGSERIAL` | EF Core handles |
| **Timestamp** | `DATETIME2` | `TIMESTAMP` | EF Core handles |
| **UUID/GUID** | `UNIQUEIDENTIFIER` | `uuid` | EF Core handles |
| **JSON** | `JSON` / `NVARCHAR(MAX)` | `JSONB` | EF Core handles |
| **Transactions** | Similar | Similar | Same semantics |

---

## ⚠️ Important Notes

### 1. Update Using Statements
```csharp
// Remove
using Microsoft.EntityFrameworkCore.SqlServer;

// Add
using Npgsql.EntityFrameworkCore.PostgreSQL;
```

### 2. Case Sensitivity
PostgreSQL is **case-sensitive** by default (SQL Server is not):
- Table names should be lowercase or quoted
- EF Core handles this automatically

### 3. Connection Pool
PostgreSQL uses connection pooling (PgBouncer):
```csharp
// Connection string for production
"Host=db.railway.internal;Port=5432;Database=AegisRadarDB;Username=postgres;Password=xxx;Max Pool Size=20;"
```

### 4. SSL/TLS
Railway requires SSL:
```
SSL Mode=Require
```

---

## 📝 Complete Updated Files

### `.env` for local development
```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=AegisRadar_Dev_Secret_Key_32_Characters_Min
ASPNETCORE_ENVIRONMENT=Development
```

### Startup Commands

**Local Development:**
```bash
docker-compose up -d
dotnet watch run --project src/AegisRadar.API/AegisRadar.API.csproj
```

**Production (Railway):**
```bash
railway up --detach
```

---

## ✅ Verification Checklist

- [ ] NuGet package updated (Npgsql.EntityFrameworkCore.PostgreSQL)
- [ ] DbContext configured for PostgreSQL
- [ ] appsettings.json updated with PostgreSQL connection string
- [ ] appsettings.Production.json created with env vars
- [ ] Hangfire configured for PostgreSQL
- [ ] docker-compose.yml updated with PostgreSQL service
- [ ] Old migrations removed, new migration created
- [ ] Local testing successful
- [ ] Railway deployed and working
- [ ] Database seeding working on cloud

---

**Next Steps:**
1. Make code changes from this guide
2. Test locally with Docker
3. Deploy to Railway
4. Monitor logs in Railway dashboard
