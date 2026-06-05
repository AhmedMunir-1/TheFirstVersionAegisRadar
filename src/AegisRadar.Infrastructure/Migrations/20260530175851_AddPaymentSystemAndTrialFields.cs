using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AegisRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentSystemAndTrialFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasPaymentMethod",
                table: "Merchants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrialActive",
                table: "Merchants",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethodToken",
                table: "Merchants",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialEndDate",
                table: "Merchants",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "DATEADD(day, 14, GETUTCDATE())");

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialStartDate",
                table: "Merchants",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TransactionReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PeriodStartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodEndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PaymentMethodLast4 = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    IsFraudDetected = table.Column<bool>(type: "bit", nullable: false),
                    FraudScore = table.Column<decimal>(type: "decimal(5,4)", nullable: true),
                    FraudReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_SubscriptionPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "SubscriptionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Merchants_TrialEndDate",
                table: "Merchants",
                column: "TrialEndDate");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MerchantId_CreatedAt",
                table: "Payments",
                columns: new[] { "MerchantId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PlanId",
                table: "Payments",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Status",
                table: "Payments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionReference",
                table: "Payments",
                column: "TransactionReference",
                unique: true,
                filter: "[TransactionReference] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Merchants_TrialEndDate",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "HasPaymentMethod",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "IsTrialActive",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "PaymentMethodToken",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "TrialEndDate",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "TrialStartDate",
                table: "Merchants");
        }
    }
}
