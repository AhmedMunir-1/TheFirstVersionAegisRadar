using AegisRadar.Infrastructure;
using AegisRadar.Worker.Consumers;
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

    // ── Kafka Consumer Background Services ────────────────────────────────────
    builder.Services.AddHostedService<TransactionConsumerService>();
    builder.Services.AddHostedService<PredictionConsumerService>();

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
