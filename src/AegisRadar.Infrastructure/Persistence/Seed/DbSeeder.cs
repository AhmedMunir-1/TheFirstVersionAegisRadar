using AegisRadar.Domain.Entities;
using AegisRadar.Shared.Constants;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;

namespace AegisRadar.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AegisRadarDbContext context)
    {
        Console.WriteLine("[DbSeeder] Starting database seeding...");
        
        // ── Apply pending migrations ────────────────────────────────────────
        try
        {
            // Check if we can reach the database before attempting migration
            var canConnect = await context.Database.CanConnectAsync();
            if (!canConnect)
            {
                Console.WriteLine(
                    "⚠ Cannot connect to database at startup. " +
                    "Verify the connection string points to ahmedmunir_AegisRadarDB on sql.bsite.net.");
                return;
            }

            // Clear data that cannot be converted from nvarchar to int
            try
            {
                await context.Database.ExecuteSqlRawAsync("DELETE FROM Alerts");
                await context.Database.ExecuteSqlRawAsync("DELETE FROM Predictions");
                await context.Database.ExecuteSqlRawAsync("DELETE FROM Payments");
                await context.Database.ExecuteSqlRawAsync("DELETE FROM Transactions");
                Console.WriteLine("✓ Cleared incompatible transactional data.");
            }
            catch
            {
                // Tables might not exist yet
            }

            // Fix enum column types if needed
            try
            {
                // Convert Transactions.Status from nvarchar(450) to int using temporary column
                await context.Database.ExecuteSqlRawAsync(@"
                    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Transactions')
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Transactions' AND COLUMN_NAME='Status_temp')
                        BEGIN
                            ALTER TABLE [Transactions] ADD [Status_temp] INT DEFAULT 0;
                            DROP INDEX IF EXISTS [IX_Transactions_Status] ON [Transactions];
                            ALTER TABLE [Transactions] DROP COLUMN [Status];
                            EXEC sp_rename '[Transactions].[Status_temp]', 'Status', 'COLUMN';
                        END
                    END");
                Console.WriteLine("✓ Converted Transactions.Status to INT.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠ Failed to convert Transactions.Status: {ex.Message}");
            }

            try
            {
                // Convert Predictions.Decision from nvarchar(max) to int
                await context.Database.ExecuteSqlRawAsync(@"
                    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Predictions')
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Predictions' AND COLUMN_NAME='Decision_temp')
                        BEGIN
                            ALTER TABLE [Predictions] ADD [Decision_temp] INT DEFAULT 0;
                            ALTER TABLE [Predictions] DROP COLUMN [Decision];
                            EXEC sp_rename '[Predictions].[Decision_temp]', 'Decision', 'COLUMN';
                        END
                    END");
                Console.WriteLine("✓ Converted Predictions.Decision to INT.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠ Failed to convert Predictions.Decision: {ex.Message}");
            }

            try
            {
                // Convert Payments.Status from nvarchar(450) to int
                await context.Database.ExecuteSqlRawAsync(@"
                    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Payments')
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Payments' AND COLUMN_NAME='Status_temp')
                        BEGIN
                            ALTER TABLE [Payments] ADD [Status_temp] INT DEFAULT 0;
                            DROP INDEX IF EXISTS [IX_Payments_Status] ON [Payments];
                            ALTER TABLE [Payments] DROP COLUMN [Status];
                            EXEC sp_rename '[Payments].[Status_temp]', 'Status', 'COLUMN';
                        END
                    END");
                Console.WriteLine("✓ Converted Payments.Status to INT.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠ Failed to convert Payments.Status: {ex.Message}");
            }

            try
            {
                // Convert Alerts.Severity from nvarchar(max) to int
                await context.Database.ExecuteSqlRawAsync(@"
                    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Alerts')
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Alerts' AND COLUMN_NAME='Severity_temp')
                        BEGIN
                            ALTER TABLE [Alerts] ADD [Severity_temp] INT DEFAULT 0;
                            ALTER TABLE [Alerts] DROP COLUMN [Severity];
                            EXEC sp_rename '[Alerts].[Severity_temp]', 'Severity', 'COLUMN';
                        END
                    END");
                Console.WriteLine("✓ Converted Alerts.Severity to INT.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠ Failed to convert Alerts.Severity: {ex.Message}");
            }

            await context.Database.MigrateAsync();
            Console.WriteLine("✓ Database migrations applied successfully.");
        }
        catch (SqlException ex) when (ex.Number == 262)
        {
            Console.WriteLine(
                "⚠ SQL Error 262: Cannot create database — permission denied. " +
                "The database 'ahmedmunir_AegisRadarDB' must already exist on sql.bsite.net. " +
                "Create it via your aspfreehosting control panel, then restart the app.");
            return;
        }
        catch (SqlException ex) when (ex.Number == 4060)
        {
            Console.WriteLine(
                $"⚠ SQL Error 4060: Database 'ahmedmunir_AegisRadarDB' does not exist. " +
                "Create it via the aspfreehosting control panel, then restart. " +
                $"Detail: {ex.Message}");
            return;
        }
        catch (SqlException ex) when (ex.Number == 18456)
        {
            Console.WriteLine(
                $"⚠ SQL Error 18456: Login failed. " +
                "Check User ID and Password in the connection string. " +
                $"Detail: {ex.Message}");
            return;
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"⚠ Migration validation failed: {ex.Message}");
            return;
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"⚠ Unexpected error during migration: {ex.GetType().Name} — {ex.Message}");
            return;
        }

        // ── Seed Data ───────────────────────────────────────────────────────
        try
        {
            // ── Subscription Plans ──────────────────────────────────────────
            if (!await context.SubscriptionPlans.AnyAsync())
            {
                var starter = new SubscriptionPlan
                {
                    Id               = Guid.Parse("11111111-0000-0000-0000-000000000001"),
                    Name             = SubscriptionPlanNames.Starter,
                    MonthlyPrice     = 1500,
                    TransactionLimit = 5000
                };
                var business = new SubscriptionPlan
                {
                    Id               = Guid.Parse("11111111-0000-0000-0000-000000000002"),
                    Name             = SubscriptionPlanNames.Business,
                    MonthlyPrice     = 4500,
                    TransactionLimit = 25000
                };
                var enterprise = new SubscriptionPlan
                {
                    Id               = Guid.Parse("11111111-0000-0000-0000-000000000003"),
                    Name             = SubscriptionPlanNames.Enterprise,
                    MonthlyPrice     = 0,    // custom pricing
                    TransactionLimit = -1    // unlimited
                };

                context.SubscriptionPlans.AddRange(starter, business, enterprise);
                await context.SaveChangesAsync();
                Console.WriteLine("✓ Subscription plans seeded.");
            }

            // ── Demo Merchant ───────────────────────────────────────────────
            Console.WriteLine("[DbSeeder] Checking for existing merchants...");
            var demoMerchantId = Guid.Parse("22222222-0000-0000-0000-000000000001");
            var demoMerchantExists = await context.Merchants.AnyAsync(m => m.Id == demoMerchantId);
            
            if (!demoMerchantExists)
            {
                Console.WriteLine("[DbSeeder] No demo merchant found, creating demo merchant...");
                var starterPlanId  = Guid.Parse("11111111-0000-0000-0000-000000000001");

                var merchant = new Merchant
                {
                    Id                    = demoMerchantId,
                    CompanyName           = "Demo Merchant EG",
                    Email                 = "demo@aegisradar.io",
                    PasswordHash          = HashPassword("Demo@1234"),
                    ApiKey                = "ar_demo_key_aegisradar_2024_secure",
                    Country               = "EG",
                    Role                  = "Admin",
                    PlanId                = starterPlanId,
                    IsEmailConfirmed      = true,   // pre-confirmed so demo works immediately
                    IsTrialActive         = true,
                    TrialStartDate        = DateTime.UtcNow,
                    TrialEndDate          = DateTime.UtcNow.AddDays(14),
                    HasPaymentMethod      = false,
                    CreatedAt             = DateTime.UtcNow
                };

                context.Merchants.Add(merchant);

                context.MerchantSubscriptions.Add(new MerchantSubscription
                {
                    MerchantId = demoMerchantId,
                    PlanId     = starterPlanId,
                    StartDate  = DateTime.UtcNow,
                    EndDate    = DateTime.UtcNow.AddMonths(1),
                    IsActive   = true
                });

                await context.SaveChangesAsync();
                Console.WriteLine("✓ Demo merchant seeded. Email: demo@aegisradar.io | Password: Demo@1234 | ApiKey: ar_demo_key_aegisradar_2024_secure");
            }
            else
            {
                Console.WriteLine("[DbSeeder] Demo merchant already exists, skipping creation.");
            }

            // ── Demo Transactions ───────────────────────────────────────
            // Always reseed transactions for today to ensure demo data is present
            {
                Console.WriteLine("⏳ Starting transaction seeding...");
                
                // Clear today's transactions for this merchant
                var today = DateTime.UtcNow.Date;
                Console.WriteLine($"📅 Today's date: {today:yyyy-MM-dd}");
                
                var todayTransactions = await context.Transactions
                    .Where(t => t.MerchantId == demoMerchantId && t.CreatedAt.Date == today)
                    .ToListAsync();
                
                Console.WriteLine($"📊 Found {todayTransactions.Count} transactions to clear");
                
                if (todayTransactions.Any())
                {
                    // Get related IDs to clean up
                    var txIds = todayTransactions.Select(t => t.Id).ToList();
                    
                    // Clear related data
                    await context.Alerts.Where(a => txIds.Contains(a.TransactionId)).ExecuteDeleteAsync();
                    await context.Predictions.Where(p => txIds.Contains(p.TransactionId)).ExecuteDeleteAsync();
                    await context.TransactionHistories.Where(h => txIds.Contains(h.TransactionId)).ExecuteDeleteAsync();
                    await context.Transactions.Where(t => txIds.Contains(t.Id)).ExecuteDeleteAsync();
                    Console.WriteLine($"🗑️  Cleared {todayTransactions.Count} old transactions and related data");
                }

                var rng      = new Random(42);
                var statuses  = new[] { Domain.Enums.TransactionStatus.Approved, Domain.Enums.TransactionStatus.Review, Domain.Enums.TransactionStatus.Blocked };
                var decisions = new[] { Domain.Enums.FraudDecision.Approved, Domain.Enums.FraudDecision.Review, Domain.Enums.FraudDecision.Blocked };
                var mccs      = new[] { 5411, 5812, 4829, 7011, 5912 };
                
                Console.WriteLine("🔄 Creating 50 new transactions...");


                for (int i = 0; i < 50; i++)
                {
                    var statusIdx = i < 35 ? 0 : (i < 45 ? 1 : 2);
                    var txId      = Guid.NewGuid();
                    var createdAt = today.AddMinutes(rng.Next(0, 1440)); // All transactions from today with random times
                    var amount    = (decimal)(rng.NextDouble() * 5000 + 10);
                    var isForeign = rng.Next(0, 5) == 0;
                    
                    if (i % 10 == 0)
                        Console.WriteLine($"   Creating transactions {i+1}-{Math.Min(i+10, 50)}...");


                    var tx = new Transaction
                    {
                        Id         = txId,
                        MerchantId = demoMerchantId,
                        CustomerId = $"cust_{rng.Next(1, 20):D3}",
                        Amount     = amount,
                        Currency   = "EGP",
                        Country    = isForeign ? "US" : "EG",
                        Mcc        = mccs[rng.Next(mccs.Length)],
                        DeviceId   = $"dev_{rng.Next(1000, 9999)}",
                        IpAddress  = $"197.{rng.Next(1, 254)}.{rng.Next(1, 254)}.{rng.Next(1, 254)}",
                        Status     = statuses[statusIdx],
                        CreatedAt  = createdAt
                    };

                    context.Transactions.Add(tx);

                    // Store the computed AI features alongside the transaction
                    context.TransactionHistories.Add(new TransactionHistory
                    {
                        TransactionId       = txId,
                        AmountRatio         = rng.NextDouble() * 4 + 0.5,
                        Hour                = createdAt.Hour,
                        IsForeign           = isForeign,
                        UserDegree          = rng.Next(1, 50),
                        MerchantDegree      = rng.Next(10, 2000),
                        Mcc                 = mccs[rng.Next(mccs.Length)],
                        UserFrequencyPerDay = rng.Next(1, 8),
                        TimeDifferenceHours = rng.NextDouble() * 24
                    });

                    context.Predictions.Add(new Prediction
                    {
                        TransactionId    = txId,
                        FraudProbability = statusIdx == 0
                            ? rng.NextDouble() * 0.4
                            : statusIdx == 1
                                ? 0.4 + rng.NextDouble() * 0.3
                                : 0.7 + rng.NextDouble() * 0.3,
                        Decision         = decisions[statusIdx],
                        ModelVersion     = "1.0.0",
                        CreatedAt        = createdAt.AddSeconds(1)
                    });

                    if (statusIdx > 0)
                    {
                        context.Alerts.Add(new Alert
                        {
                            MerchantId    = demoMerchantId,
                            TransactionId = txId,
                            Severity      = statusIdx == 1
                                ? Domain.Enums.AlertSeverity.Medium
                                : Domain.Enums.AlertSeverity.High,
                            Message   = statusIdx == 1
                                ? $"Transaction flagged for review: {txId}"
                                : $"Transaction BLOCKED — fraud score above threshold: {txId}",
                            IsRead    = rng.Next(0, 2) == 0,
                            CreatedAt = createdAt.AddSeconds(2)
                        });
                    }
                }

                await context.SaveChangesAsync();
                
                // Verify seeding succeeded
                var savedTxCount = await context.Transactions.CountAsync(t => t.MerchantId == demoMerchantId && t.CreatedAt.Date == today);
                Console.WriteLine($"✓ Seeding completed. Saved {savedTxCount} transactions for today.");
                if (savedTxCount != 50)
                    Console.WriteLine($"⚠️  WARNING: Expected 50 transactions but saved {savedTxCount}");
            }
        }
        catch (SqlException ex)
        {
            Console.WriteLine($"⚠ SQL error during seeding: {ex.Number} — {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠ Seeding error: {ex.GetType().Name} — {ex.Message}");
        }
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}
