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

    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddHostedService<TransactionConsumerService>();
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
