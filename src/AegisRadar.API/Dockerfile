# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore (layer cache optimisation)
COPY ["src/AegisRadar.API/AegisRadar.API.csproj",           "src/AegisRadar.API/"]
COPY ["src/AegisRadar.Application/AegisRadar.Application.csproj", "src/AegisRadar.Application/"]
COPY ["src/AegisRadar.Domain/AegisRadar.Domain.csproj",     "src/AegisRadar.Domain/"]
COPY ["src/AegisRadar.Infrastructure/AegisRadar.Infrastructure.csproj", "src/AegisRadar.Infrastructure/"]
COPY ["src/AegisRadar.Shared/AegisRadar.Shared.csproj",     "src/AegisRadar.Shared/"]
RUN dotnet restore "src/AegisRadar.API/AegisRadar.API.csproj"

# Copy full source and publish
COPY . .
WORKDIR "/src/src/AegisRadar.API"
RUN dotnet publish "AegisRadar.API.csproj" -c Release -o /app/publish --no-restore

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN groupadd --system aegis && useradd --system --gid aegis aegis
USER aegis

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet", "AegisRadar.API.dll"]
