using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AegisRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedSubscriptionPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SubscriptionPlans",
                columns: new[] { "Id", "Name", "MonthlyPrice", "TransactionLimit", "CreatedAt" },
                values: new object[,]
                {
                    { new System.Guid("11111111-0000-0000-0000-000000000001"), "Starter", 49.99m, 10000, System.DateTime.UtcNow },
                    { new System.Guid("11111111-0000-0000-0000-000000000002"), "Professional", 149.99m, 100000, System.DateTime.UtcNow },
                    { new System.Guid("11111111-0000-0000-0000-000000000003"), "Enterprise", 499.99m, 1000000, System.DateTime.UtcNow }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SubscriptionPlans",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new System.Guid("11111111-0000-0000-0000-000000000001"),
                    new System.Guid("11111111-0000-0000-0000-000000000002"),
                    new System.Guid("11111111-0000-0000-0000-000000000003")
                });
        }
    }
}
