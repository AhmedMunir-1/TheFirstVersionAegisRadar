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
        try
        {
            await context.Database.MigrateAsync();
        }
        catch (InvalidOperationException ex)
        {
            // Suppress migration validation errors at startup to allow hot-reload
            // The issue is usually caused by non-deterministic model data used in seeding.
            // We surface the error in logs but continue so the app can start for debugging.
            Console.WriteLine("Warning: migration validation failed during seeding: " + ex.Message);
            return; // Skip seeding if migrations fail
        }
        catch (SqlException ex) when (ex.Number == 262)
        {
            // Permission denied to CREATE DATABASE - common on shared hosting
            // The database may already exist or needs to be created manually through hosting panel
            Console.WriteLine($"Warning: Cannot create database (Permission Denied). The database may need to be created manually through your hosting panel. Error: {ex.Message}");
            return; // Skip seeding if we can't create database
        }
        catch (SqlException ex) when (ex.Number == 4060)
        {
            // Cannot open database - database doesn't exist
            Console.WriteLine($"Warning: Database does not exist yet. Please create the database through your hosting provider's control panel. Error: {ex.Message}");
            return; // Skip seeding if database doesn't exist
        }
        catch (Exception ex)
        {
            // Log other exceptions but continue to allow app to start
            Console.WriteLine($"Warning: Database seeding encountered an error: {ex.GetType().Name} - {ex.Message}");
            return; // Skip seeding on any error
        }

        try
        {
            // ── Subscription Plans ─────────────────────────────────────────────
            if (!await context.SubscriptionPlans.AnyAsync())
            {
                var starter    = new SubscriptionPlan { Id = Guid.Parse("11111111-0000-0000-0000-000000000001"), Name = SubscriptionPlanNames.Starter,    MonthlyPrice = 299,  TransactionLimit = 5000 };
                var business   = new SubscriptionPlan { Id = Guid.Parse("11111111-0000-0000-0000-000000000002"), Name = SubscriptionPlanNames.Business,   MonthlyPrice = 999,  TransactionLimit = 25000 };
                var enterprise = new SubscriptionPlan { Id = Guid.Parse("11111111-0000-0000-0000-000000000003"), Name = SubscriptionPlanNames.Enterprise, MonthlyPrice = 2999, TransactionLimit = -1 };

                context.SubscriptionPlans.AddRange(starter, business, enterprise);
                await context.SaveChangesAsync();
            }

            // ── Demo Merchant ──────────────────────────────────────────────────
            if (!await context.Merchants.AnyAsync())
            {
            var demoMerchantId = Guid.Parse("22222222-0000-0000-0000-000000000001");
            var starterPlanId  = Guid.Parse("11111111-0000-0000-0000-000000000001");

            var merchant = new Merchant
            {
                Id           = demoMerchantId,
                CompanyName  = "Demo Merchant EG",
                Email        = "demo@aegisradar.io",
                PasswordHash = HashPassword("Demo@1234"),
                ApiKey       = "ar_demo_key_aegisradar_2024_secure",
                Country      = "EG",
                Role         = "Admin",
                PlanId       = starterPlanId,
                CreatedAt    = DateTime.UtcNow
            };

            context.Merchants.Add(merchant);

            // ── Demo Subscription ──────────────────────────────────────────
            context.MerchantSubscriptions.Add(new MerchantSubscription
            {
                MerchantId = demoMerchantId,
                PlanId     = starterPlanId,
                StartDate  = DateTime.UtcNow,
                EndDate    = DateTime.UtcNow.AddMonths(1),
                IsActive   = true
            });

            await context.SaveChangesAsync();

            // ── Demo Transactions ──────────────────────────────────────────
            var rng = new Random(42);
            var statuses = new[] { Domain.Enums.TransactionStatus.Approved, Domain.Enums.TransactionStatus.Review, Domain.Enums.TransactionStatus.Blocked };
            var decisions = new[] { Domain.Enums.FraudDecision.Approved, Domain.Enums.FraudDecision.Review, Domain.Enums.FraudDecision.Blocked };
            var mccs = new[] { 5411, 5812, 4829, 7011, 5912 };

            for (int i = 0; i < 50; i++)
            {
                var statusIdx = i < 35 ? 0 : (i < 45 ? 1 : 2);
                var txId = Guid.NewGuid();
                var createdAt = DateTime.UtcNow.AddHours(-rng.Next(0, 168));

                var tx = new Transaction
                {
                    Id         = txId,
                    MerchantId = demoMerchantId,
                    CustomerId = $"cust_{rng.Next(1, 20):D3}",
                    Amount     = (decimal)(rng.NextDouble() * 5000 + 10),
                    Currency   = "EGP",
                    Country    = rng.Next(0, 5) == 0 ? "US" : "EG",
                    Mcc        = mccs[rng.Next(mccs.Length)],
                    DeviceId   = $"dev_{rng.Next(1000, 9999)}",
                    IpAddress  = $"197.{rng.Next(1, 254)}.{rng.Next(1, 254)}.{rng.Next(1, 254)}",
                    Status     = statuses[statusIdx],
                    CreatedAt  = createdAt
                };

                context.Transactions.Add(tx);

                context.Predictions.Add(new Prediction
                {
                    TransactionId    = txId,
                    FraudProbability = statusIdx == 0 ? rng.NextDouble() * 0.4 : (statusIdx == 1 ? 0.4 + rng.NextDouble() * 0.3 : 0.7 + rng.NextDouble() * 0.3),
                    Decision         = decisions[statusIdx],
                    ModelVersion     = "1.0.0",
                    CreatedAt        = createdAt.AddSeconds(1)
                });

                if (statusIdx > 0)
                {
                    context.Alerts.Add(new Alert
                    {
                        MerchantId     = demoMerchantId,
                        TransactionId  = txId,
                        Severity       = statusIdx == 1 ? Domain.Enums.AlertSeverity.Medium : Domain.Enums.AlertSeverity.High,
                        Message        = statusIdx == 1 ? $"Transaction flagged for review: {txId}" : $"Transaction BLOCKED — fraud score above threshold: {txId}",
                        IsRead         = rng.Next(0, 2) == 0,
                        CreatedAt      = createdAt.AddSeconds(2)
                    });
                }
            }

            await context.SaveChangesAsync();
            }
        }
        catch (SqlException ex)
        {
            // Handle database errors during seeding
            Console.WriteLine($"Warning: Database seeding failed with SQL error: {ex.Number} - {ex.Message}");
        }
        catch (Exception ex)
        {
            // Handle any other errors during seeding
            Console.WriteLine($"Warning: Database seeding failed: {ex.GetType().Name} - {ex.Message}");
        }
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}
