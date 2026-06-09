using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System.IO;
using System.Text.Json;

namespace AegisRadar.Infrastructure.Persistence;

public class AegisRadarDbContextFactory : IDesignTimeDbContextFactory<AegisRadarDbContext>
{
    public AegisRadarDbContext CreateDbContext(string[] args)
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "src", "AegisRadar.API");
        var appsettingsPath = Path.Combine(basePath, "appsettings.json");

        string connectionString = "Server=localhost,1433;Database=AegisRadarDB;User ID=sa;Password=StrongPassword123;Encrypt=True;TrustServerCertificate=True;";

        // Try to load from appsettings.json if it exists
        if (File.Exists(appsettingsPath))
        {
            try
            {
                var json = File.ReadAllText(appsettingsPath);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("ConnectionStrings", out var connStrings))
                {
                    if (connStrings.TryGetProperty("DefaultConnection", out var defaultConn))
                    {
                        connectionString = defaultConn.GetString() ?? connectionString;
                    }
                }
            }
            catch
            {
                // Use default connection string if parsing fails
            }
        }

        var optionsBuilder = new DbContextOptionsBuilder<AegisRadarDbContext>()
            .UseSqlServer(connectionString, options =>
                options.MigrationsHistoryTable("__EFMigrationsHistory", "dbo"));

        return new AegisRadarDbContext(optionsBuilder.Options);
    }
}
