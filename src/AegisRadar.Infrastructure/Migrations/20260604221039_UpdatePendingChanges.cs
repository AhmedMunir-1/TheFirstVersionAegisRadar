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
            // Add columns only if they don't already exist (idempotent)
            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                               WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'EmailVerificationCode')
                  ALTER TABLE [Merchants] ADD [EmailVerificationCode] nvarchar(max) NULL;");

            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                               WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'EmailVerificationExpires')
                  ALTER TABLE [Merchants] ADD [EmailVerificationExpires] datetime2 NULL;");

            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                               WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'IsEmailConfirmed')
                  ALTER TABLE [Merchants] ADD [IsEmailConfirmed] bit NOT NULL DEFAULT 0;");

            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                               WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'PasswordResetCode')
                  ALTER TABLE [Merchants] ADD [PasswordResetCode] nvarchar(max) NULL;");

            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                               WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'PasswordResetExpires')
                  ALTER TABLE [Merchants] ADD [PasswordResetExpires] datetime2 NULL;");
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
