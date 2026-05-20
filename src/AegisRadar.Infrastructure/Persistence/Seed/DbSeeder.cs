using AegisRadar.Domain.Entities;
using AegisRadar.Shared.Constants;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace AegisRadar.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AegisRadarDbContext context)
    {
        await context.Database.MigrateAsync();

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

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}
