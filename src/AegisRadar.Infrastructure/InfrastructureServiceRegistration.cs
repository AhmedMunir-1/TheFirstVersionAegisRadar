using AegisRadar.Application.Interfaces;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Infrastructure.Cache;
using AegisRadar.Infrastructure.Kafka;
using AegisRadar.Infrastructure.Persistence;
using AegisRadar.Infrastructure.Persistence.Repositories;
using AegisRadar.Infrastructure.Services;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace AegisRadar.Infrastructure;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── EF Core / SQL Server ───────────────────────────────────────────
        services.AddDbContext<AegisRadarDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.MigrationsAssembly(typeof(AegisRadarDbContext).Assembly.FullName)));

        // ── Repositories & Unit of Work ────────────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IPredictionRepository, PredictionRepository>();
        services.AddScoped<IAlertRepository, AlertRepository>();
        services.AddScoped<IMerchantRepository, MerchantRepository>();
        services.AddScoped<ITransactionHistoryRepository, TransactionHistoryRepository>();

        // ── Redis ──────────────────────────────────────────────────────────
        var redisConnection = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(redisConnection));
        services.AddSingleton<ICacheService, RedisCacheService>();

        // ── Kafka ──────────────────────────────────────────────────────────
        services.Configure<KafkaSettings>(configuration.GetSection("Kafka"));
        services.AddSingleton<IKafkaProducer, KafkaProducer>();

        // ── External AI API HTTP Client ────────────────────────────────────────
        services.Configure<AiServiceSettings>(configuration.GetSection("AiService"));
        services.AddHttpClient<IFraudDetectionService, FraudDetectionService>(client =>
        {
            var baseUrl = configuration["AiService:BaseUrl"] ?? "http://localhost:8000";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout     = TimeSpan.FromSeconds(10);
        });

        // ── Domain Services ────────────────────────────────────────────────
        services.AddScoped<IFeatureEngineeringService, FeatureEngineeringService>();
        services.AddScoped<INotificationService, SignalRNotificationService>();

        // ── Auth ───────────────────────────────────────────────────────────
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.AddScoped<ITokenService, TokenService>();

        // ── Hangfire ───────────────────────────────────────────────────────
        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection"),
                new SqlServerStorageOptions
                {
                    CommandBatchMaxTimeout       = TimeSpan.FromMinutes(5),
                    SlidingInvisibilityTimeout   = TimeSpan.FromMinutes(5),
                    QueuePollInterval            = TimeSpan.Zero,
                    UseRecommendedIsolationLevel = true,
                    DisableGlobalLocks           = true
                }));

        services.AddHangfireServer();

        return services;
    }

}
