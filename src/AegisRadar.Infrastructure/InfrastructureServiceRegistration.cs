using AegisRadar.Domain.Interfaces;
using AegisRadar.Infrastructure.Kafka;
using AegisRadar.Infrastructure.Persistence;
using AegisRadar.Infrastructure.Persistence.Repositories;
using AegisRadar.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AegisRadar.Infrastructure;

// ─────────────────────────────────────────────────────────────────────────────
// All database connectivity targets SQL Server (sql.bsite.net / aspfreehosting).
// Database name: ahmedmunir_AegisRadarDB
// ─────────────────────────────────────────────────────────────────────────────

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "DefaultConnection is not configured. " +
                "Check appsettings.json → ConnectionStrings → DefaultConnection.");

        // ── EF Core / SQL Server ────────────────────────────────────────────
        services.AddDbContext<AegisRadarDbContext>(options =>
            options.UseSqlServer(
                connectionString,
                sqlServer =>
                {
                    sqlServer.MigrationsAssembly(typeof(AegisRadarDbContext).Assembly.FullName);
                    // Retry on transient failures — important for shared hosting
                    sqlServer.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorNumbersToAdd: null);
                    sqlServer.CommandTimeout(60);
                }));

        // ── Repositories & Unit of Work ────────────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IPredictionRepository, PredictionRepository>();
        services.AddScoped<IAlertRepository, AlertRepository>();
        services.AddScoped<IMerchantRepository, MerchantRepository>();
        services.AddScoped<ITransactionHistoryRepository, TransactionHistoryRepository>();

        // ── Kafka ──────────────────────────────────────────────────────────
        services.Configure<KafkaSettings>(configuration.GetSection("Kafka"));
        services.AddSingleton<IKafkaProducer, KafkaProducer>();

        // ── External AI API HTTP Client ────────────────────────────────────
        services.Configure<AiServiceSettings>(configuration.GetSection("AiService"));
        services.AddHttpClient<IFraudDetectionService, FraudDetectionService>(client =>
        {
            var baseUrl = configuration["AiService:BaseUrl"] ?? "http://host.docker.internal:8001";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout     = TimeSpan.FromSeconds(10);
        });

        // ── Domain Services ────────────────────────────────────────────────
        services.AddScoped<IFeatureEngineeringService, FeatureEngineeringService>();
        services.AddScoped<INotificationService, SignalRNotificationService>();
        services.AddScoped<IDemoTransactionGenerator, DemoTransactionGenerator>();

        // ── Auth ───────────────────────────────────────────────────────────
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.AddScoped<ITokenService, TokenService>();

        return services;
    }
}
