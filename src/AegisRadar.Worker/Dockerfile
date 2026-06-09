# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/AegisRadar.Worker/AegisRadar.Worker.csproj",           "src/AegisRadar.Worker/"]
COPY ["src/AegisRadar.Domain/AegisRadar.Domain.csproj",           "src/AegisRadar.Domain/"]
COPY ["src/AegisRadar.Infrastructure/AegisRadar.Infrastructure.csproj", "src/AegisRadar.Infrastructure/"]
COPY ["src/AegisRadar.Shared/AegisRadar.Shared.csproj",           "src/AegisRadar.Shared/"]
RUN dotnet restore "src/AegisRadar.Worker/AegisRadar.Worker.csproj"

COPY . .
WORKDIR "/src/src/AegisRadar.Worker"
RUN dotnet publish "AegisRadar.Worker.csproj" -c Release -o /app/publish --no-restore

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/runtime:10.0 AS runtime
WORKDIR /app

RUN groupadd --system aegis && useradd --system --gid aegis aegis
USER aegis

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "AegisRadar.Worker.dll"]
