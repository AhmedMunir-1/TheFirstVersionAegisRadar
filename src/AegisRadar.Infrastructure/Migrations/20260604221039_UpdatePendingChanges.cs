using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AegisRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePendingChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationCode",
                table: "Merchants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerificationExpires",
                table: "Merchants",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailConfirmed",
                table: "Merchants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetCode",
                table: "Merchants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetExpires",
                table: "Merchants",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailVerificationCode",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "EmailVerificationExpires",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "IsEmailConfirmed",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "PasswordResetCode",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "PasswordResetExpires",
                table: "Merchants");
        }
    }
}
