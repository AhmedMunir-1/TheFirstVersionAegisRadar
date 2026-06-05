using AegisRadar.API.Hubs;
using AegisRadar.API.Middleware;
using AegisRadar.Application.Validators;
using AegisRadar.Infrastructure;
using AegisRadar.Infrastructure.Jobs;
using AegisRadar.Infrastructure.Persistence;
using AegisRadar.Infrastructure.Persistence.Seed;
using AegisRadar.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using System.Threading.RateLimiting;

// ── Bootstrap Serilog ─────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/aegisradar-.log", rollingInterval: RollingInterval.Day)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ───────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, config) => config
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/aegisradar-.log", rollingInterval: RollingInterval.Day));

    // ── Infrastructure (EF Core / SQL Server / Redis / Kafka / Hangfire) ──────
    // FIX: AddInfrastructure now registers AddHangfireServer() with resilience.
    builder.Services.AddInfrastructure(builder.Configuration);

    // ── MediatR ───────────────────────────────────────────────────────────────
    builder.Services.AddMediatR(cfg =>
        cfg.RegisterServicesFromAssembly(typeof(AegisRadar.Application.Features.Auth.Commands.LoginCommand).Assembly));

    // ── FluentValidation ──────────────────────────────────────────────────────
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<TransactionRequestValidator>();

    // ── Controllers & SignalR ─────────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddSignalR(options =>
    {
        options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    });
    builder.Services.AddSingleton<HubNotificationService>();

    // ── JWT Authentication ────────────────────────────────────────────────────
    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("JWT Secret not configured.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = builder.Configuration["Jwt:Issuer"],
                ValidAudience            = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
            };

            // Allow SignalR to use token from query string
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    var token = ctx.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(token) && ctx.Request.Path.StartsWithSegments("/hubs"))
                        ctx.Token = token;
                    return Task.CompletedTask;
                }
            };
        });

    builder.Services.AddAuthorization();

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    builder.Services.AddRateLimiter(options =>
    {
        options.AddFixedWindowLimiter("api", config =>
        {
            config.PermitLimit          = 100;
            config.Window               = TimeSpan.FromMinutes(1);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit           = 5;
        });
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

    // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title       = "AegisRadar — AI Fraud Detection API",
            Version     = "v1",
            Description = "Real-time fraud detection SaaS platform.",
        });
    });

    // ── CORS ──────────────────────────────────────────────────────────────────
    builder.Services.AddCors(options =>
        options.AddDefaultPolicy(policy =>
            policy.AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()
                  .SetIsOriginAllowed(_ => true)));

    // ═══════════════════════════════════════════════════════════════════════════
    var app = builder.Build();
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Seed Database ─────────────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AegisRadarDbContext>();
        await DbSeeder.SeedAsync(db);
    }

    // ── Hangfire Recurring Jobs ───────────────────────────────────────────────
    // FIX: AddHangfireServer() is now registered inside AddInfrastructure().
    //      Here we only schedule the recurring job. Wrapped in try/catch so a
    //      missing Hangfire schema (first startup before DB exists) doesn't crash.
    try
    {
        var recurringJobs = app.Services.GetRequiredService<IRecurringJobManager>();
        recurringJobs.AddOrUpdate<FraudSummaryJob>(
            "fraud-daily-summary",
            job => job.ExecuteAsync(),
            Cron.Daily);
        Console.WriteLine("✓ Hangfire recurring jobs configured successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            $"⚠ Could not configure Hangfire recurring jobs " +
            $"(DB may not have Hangfire schema yet): {ex.Message}");
    }

    // ── Middleware Pipeline ───────────────────────────────────────────────────
    app.UseMiddleware<ExceptionHandlingMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "AegisRadar v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseSerilogRequestLogging();
    app.UseCors();
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseMiddleware<ApiKeyMiddleware>();
    app.UseAuthorization();

    try
    {
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            DashboardTitle = "AegisRadar — Background Jobs"
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠ Hangfire dashboard not available: {ex.Message}");
    }

    app.MapControllers();
    app.MapHub<FraudAlertHub>("/hubs/fraud-alerts");

    app.MapGet("/health", () => Results.Ok(new
    {
        status    = "healthy",
        service   = "AegisRadar API",
        timestamp = DateTime.UtcNow,
        database  = "ahmedmunir_AegisRadarDB @ sql.bsite.net"
    }))
    .WithTags("Health")
    .AllowAnonymous();

    Log.Information("AegisRadar API starting on {Urls}", string.Join(", ", app.Urls));
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "AegisRadar API terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
