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
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

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
                    // Retry on transient failures — important for shared hosting (sql.bsite.net)
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
        services.AddScoped<IPaymentRepository, PaymentRepository>();

        // ── Redis ───────────────────────────────────────────────────────────
        // Falls back to a no-op in-memory stub if Redis is unavailable,
        // so the API can still serve requests without a local Redis instance.
        var redisConnection = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        try
        {
            var redisConfig = ConfigurationOptions.Parse(redisConnection);
            redisConfig.ConnectTimeout     = 3000;   // 3 s — fail fast
            redisConfig.SyncTimeout        = 3000;
            redisConfig.AbortOnConnectFail = false;   // do NOT throw on startup

            var multiplexer = ConnectionMultiplexer.Connect(redisConfig);
            services.AddSingleton<IConnectionMultiplexer>(multiplexer);
            services.AddSingleton<ICacheService, RedisCacheService>();
        }
        catch (Exception ex)
        {
            // Redis unavailable — register a no-op cache so the app keeps running
            var logger = services.BuildServiceProvider()
                .GetService<ILogger<InMemoryFallbackCacheService>>();
            logger?.LogWarning(ex,
                "Redis not reachable at '{Redis}'. Using in-memory fallback cache.", redisConnection);
            services.AddSingleton<ICacheService, InMemoryFallbackCacheService>();
        }

        // ── Kafka ──────────────────────────────────────────────────────────
        services.Configure<KafkaSettings>(configuration.GetSection("Kafka"));
        services.AddSingleton<IKafkaProducer, KafkaProducer>();

        // ── External AI API HTTP Client ────────────────────────────────────
        services.Configure<AiServiceSettings>(configuration.GetSection("AiService"));
        services.AddHttpClient<IFraudDetectionService, FraudDetectionService>(client =>
        {
            var baseUrl = configuration["AiService:BaseUrl"] ?? "http://localhost:8000";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout     = TimeSpan.FromSeconds(10);
        });

        // ── Email / SMTP ───────────────────────────────────────────────────
        services.Configure<EmailSettings>(configuration.GetSection("Email"));
        services.AddScoped<IEmailService, SmtpEmailService>();

        // ── Domain Services ────────────────────────────────────────────────
        services.AddScoped<IFeatureEngineeringService, FeatureEngineeringService>();
        services.AddScoped<INotificationService, SignalRNotificationService>();
        services.AddScoped<IDemoTransactionGenerator, DemoTransactionGenerator>();

        // ── Auth ───────────────────────────────────────────────────────────
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.AddScoped<ITokenService, TokenService>();

        // ── Hangfire (SQL Server storage, same DB) ─────────────────────────
        // FIX: AddHangfireServer() was removed previously, causing background
        //      jobs to never execute. Restored with graceful error handling so
        //      the app can still start even if the DB is temporarily unavailable.
        try
        {
            services.AddHangfire(config => config
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
                {
                    CommandBatchMaxTimeout       = TimeSpan.FromMinutes(5),
                    SlidingInvisibilityTimeout   = TimeSpan.FromMinutes(5),
                    QueuePollInterval            = TimeSpan.Zero,
                    UseRecommendedIsolationLevel = true,
                    DisableGlobalLocks           = true
                }));

            services.AddHangfireServer(opts =>
            {
                opts.WorkerCount = 2;  // low footprint — shared hosting
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"⚠ Hangfire could not be initialised (DB may not exist yet): {ex.Message}");
        }

        return services;
    }
}
