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
    public DbSet<Alert> Alerts { get; set; } = null!;
    public DbSet<MerchantApiKey> MerchantApiKeys { get; set; } = null!;
    public DbSet<AppNotification> AppNotifications { get; set; } = null!;

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
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Alert>()
            .HasOne(a => a.Transaction)
            .WithMany(t => t.Alerts)
            .HasForeignKey(a => a.TransactionId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<MerchantApiKey>()
            .HasOne(k => k.Merchant)
            .WithMany()
            .HasForeignKey(k => k.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AppNotification>()
            .HasOne(n => n.Merchant)
            .WithMany()
            .HasForeignKey(n => n.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure decimal properties with precision and scale
        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasPrecision(18, 2);

        base.OnModelCreating(modelBuilder);
    }
}
