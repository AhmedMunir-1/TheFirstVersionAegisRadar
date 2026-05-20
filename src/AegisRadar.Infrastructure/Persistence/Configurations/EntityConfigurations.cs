using AegisRadar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AegisRadar.Infrastructure.Persistence.Configurations;

public class MerchantConfiguration : IEntityTypeConfiguration<Merchant>
{
    public void Configure(EntityTypeBuilder<Merchant> b)
    {
        b.HasKey(m => m.Id);
        b.Property(m => m.CompanyName).IsRequired().HasMaxLength(200);
        b.Property(m => m.Email).IsRequired().HasMaxLength(200);
        b.Property(m => m.ApiKey).IsRequired().HasMaxLength(100);
        b.Property(m => m.Country).HasMaxLength(2).HasDefaultValue("EG");
        b.Property(m => m.Role).HasMaxLength(20).HasDefaultValue("Admin");
        b.Property(m => m.PasswordHash).IsRequired().HasMaxLength(500);

        b.HasIndex(m => m.ApiKey).IsUnique();
        b.HasIndex(m => m.Email).IsUnique();

        b.HasOne(m => m.Plan)
         .WithMany(p => p.Merchants)
         .HasForeignKey(m => m.PlanId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> b)
    {
        b.HasKey(p => p.Id);
        b.Property(p => p.Name).IsRequired().HasMaxLength(50);
        b.Property(p => p.MonthlyPrice).HasColumnType("decimal(18,2)");
        b.HasIndex(p => p.Name).IsUnique();
    }
}

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> b)
    {
        b.HasKey(t => t.Id);
        b.Property(t => t.CustomerId).IsRequired().HasMaxLength(100);
        b.Property(t => t.Amount).HasColumnType("decimal(18,4)");
        b.Property(t => t.Currency).HasMaxLength(3);
        b.Property(t => t.Country).HasMaxLength(2);
        b.Property(t => t.DeviceId).HasMaxLength(200);
        b.Property(t => t.IpAddress).HasMaxLength(45);
        b.Property(t => t.Status).HasConversion<string>();

        // Composite indexes for feature-engineering queries
        b.HasIndex(t => new { t.MerchantId, t.CreatedAt });
        b.HasIndex(t => new { t.CustomerId, t.CreatedAt });
        b.HasIndex(t => t.Status);

        b.HasOne(t => t.Merchant)
         .WithMany(m => m.Transactions)
         .HasForeignKey(t => t.MerchantId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PredictionConfiguration : IEntityTypeConfiguration<Prediction>
{
    public void Configure(EntityTypeBuilder<Prediction> b)
    {
        b.HasKey(p => p.Id);
        b.Property(p => p.Decision).HasConversion<string>();
        b.Property(p => p.ModelVersion).HasMaxLength(20);
        b.HasIndex(p => p.TransactionId).IsUnique();

        b.HasOne(p => p.Transaction)
         .WithOne(t => t.Prediction)
         .HasForeignKey<Prediction>(p => p.TransactionId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AlertConfiguration : IEntityTypeConfiguration<Alert>
{
    public void Configure(EntityTypeBuilder<Alert> b)
    {
        b.HasKey(a => a.Id);
        b.Property(a => a.Severity).HasConversion<string>();
        b.Property(a => a.Message).IsRequired().HasMaxLength(500);
        b.HasIndex(a => new { a.MerchantId, a.IsRead });

        b.HasOne(a => a.Merchant)
         .WithMany(m => m.Alerts)
         .HasForeignKey(a => a.MerchantId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(a => a.Transaction)
         .WithMany(t => t.Alerts)
         .HasForeignKey(a => a.TransactionId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TransactionHistoryConfiguration : IEntityTypeConfiguration<TransactionHistory>
{
    public void Configure(EntityTypeBuilder<TransactionHistory> b)
    {
        b.HasKey(h => h.Id);
        b.HasIndex(h => h.TransactionId).IsUnique();

        b.HasOne(h => h.Transaction)
         .WithOne(t => t.History)
         .HasForeignKey<TransactionHistory>(h => h.TransactionId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MerchantSubscriptionConfiguration : IEntityTypeConfiguration<MerchantSubscription>
{
    public void Configure(EntityTypeBuilder<MerchantSubscription> b)
    {
        b.HasKey(s => s.Id);
        b.HasIndex(s => new { s.MerchantId, s.IsActive });

        b.HasOne(s => s.Merchant)
         .WithMany(m => m.Subscriptions)
         .HasForeignKey(s => s.MerchantId)
         .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(s => s.Plan)
         .WithMany(p => p.MerchantSubscriptions)
         .HasForeignKey(s => s.PlanId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}
