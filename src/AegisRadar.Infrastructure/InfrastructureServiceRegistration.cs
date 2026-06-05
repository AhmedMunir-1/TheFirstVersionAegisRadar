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

// SQL Server configuration for local development and deployment
// Connection string format: Server=server;Database=dbname;User Id=user;Password=pass;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── EF Core / SQL Server ────────────────────────────────────────────
        services.AddDbContext<AegisRadarDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sqlServer => sqlServer.MigrationsAssembly(typeof(AegisRadarDbContext).Assembly.FullName)));

        // ── Repositories & Unit of Work ────────────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IPredictionRepository, PredictionRepository>();
        services.AddScoped<IAlertRepository, AlertRepository>();
        services.AddScoped<IMerchantRepository, MerchantRepository>();
        services.AddScoped<ITransactionHistoryRepository, TransactionHistoryRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();

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

        // ── Email / SMTP
        services.Configure<EmailSettings>(configuration.GetSection("Email"));
        services.AddScoped<IEmailService, SmtpEmailService>();

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
            .UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection")));

        // NOTE: AddHangfireServer() removed to allow app startup when database is unavailable
        // It will be registered later in Program.cs with error handling
        // services.AddHangfireServer();

        return services;
    }

}
