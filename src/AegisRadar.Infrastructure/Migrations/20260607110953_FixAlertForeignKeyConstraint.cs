using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AegisRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAlertForeignKeyConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alerts_Transactions_TransactionId",
                table: "Alerts");

            migrationBuilder.AddForeignKey(
                name: "FK_Alerts_Transactions_TransactionId",
                table: "Alerts",
                column: "TransactionId",
                principalTable: "Transactions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alerts_Transactions_TransactionId",
                table: "Alerts");

            migrationBuilder.AddForeignKey(
                name: "FK_Alerts_Transactions_TransactionId",
                table: "Alerts",
                column: "TransactionId",
                principalTable: "Transactions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
