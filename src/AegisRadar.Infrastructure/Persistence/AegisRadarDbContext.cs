using AegisRadar.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence;

public class AegisRadarDbContext : DbContext
{
    public AegisRadarDbContext(DbContextOptions<AegisRadarDbContext> options)
        : base(options)
    {
    }

    public DbSet<Merchant> Merchants { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<Prediction> Predictions { get; set; } = null!;
    public DbSet<TransactionHistory> TransactionHistories { get; set; } = null!;
    public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; } = null!;
    public DbSet<MerchantSubscription> MerchantSubscriptions { get; set; } = null!;
    public DbSet<Alert> Alerts { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(w =>
        {
            // Suppress pending model changes warning during migrations
            w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning);
        });
        base.OnConfiguring(optionsBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Merchant>()
            .HasOne(m => m.Plan)
            .WithMany(p => p.Merchants)
            .HasForeignKey(m => m.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Merchant)
            .WithMany(m => m.Transactions)
            .HasForeignKey(t => t.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Prediction)
            .WithOne(p => p.Transaction)
            .HasForeignKey<Prediction>(p => p.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.History)
            .WithOne(h => h.Transaction)
            .HasForeignKey<TransactionHistory>(h => h.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Alert>()
            .HasOne(a => a.Merchant)
            .WithMany(m => m.Alerts)
            .HasForeignKey(a => a.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Alert>()
            .HasOne(a => a.Transaction)
            .WithMany(t => t.Alerts)
            .HasForeignKey(a => a.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantSubscription>()
            .HasOne(ms => ms.Merchant)
            .WithMany(m => m.Subscriptions)
            .HasForeignKey(ms => ms.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MerchantSubscription>()
            .HasOne(ms => ms.Plan)
            .WithMany(p => p.MerchantSubscriptions)
            .HasForeignKey(ms => ms.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Merchant)
            .WithMany(m => m.Payments)
            .HasForeignKey(p => p.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Plan)
            .WithMany()
            .HasForeignKey(p => p.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure decimal properties with precision and scale
        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Payment>()
            .Property(p => p.FraudScore)
            .HasPrecision(5, 2);

        modelBuilder.Entity<SubscriptionPlan>()
            .Property(p => p.MonthlyPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasPrecision(18, 2);

        base.OnModelCreating(modelBuilder);
    }
}
