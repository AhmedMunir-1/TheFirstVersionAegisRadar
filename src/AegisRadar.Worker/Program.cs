using AegisRadar.Infrastructure;
using AegisRadar.Worker.Consumers;
using AegisRadar.Worker.Services;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    builder.Services.AddSerilog((services, config) => config
        .ReadFrom.Configuration(builder.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    // ── Infrastructure (EF, Repos, Kafka, Redis, ML Client) ──────────────────
    builder.Services.AddInfrastructure(builder.Configuration);

    // ── MediatR ───────────────────────────────────────────────────────────────
    builder.Services.AddMediatR(cfg =>
        cfg.RegisterServicesFromAssembly(typeof(AegisRadar.Application.Features.Auth.Commands.LoginCommand).Assembly));

    // ── Kafka Consumer Background Services ────────────────────────────────────
    builder.Services.AddHostedService<TransactionConsumerService>();
    builder.Services.AddHostedService<PredictionConsumerService>();
    builder.Services.AddHostedService<DemoTransactionGeneratorService>();

    var host = builder.Build();
    Log.Information("AegisRadar Worker starting...");
    await host.RunAsync();
}

catch (Exception ex)
{
    Log.Fatal(ex, "AegisRadar Worker terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
