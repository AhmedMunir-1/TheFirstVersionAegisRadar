using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AegisRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class IncreaseCountryColumnLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Country",
                table: "Merchants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "EG",
                oldClrType: typeof(string),
                oldType: "nvarchar(2)",
                oldMaxLength: 2,
                oldDefaultValue: "EG");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Country",
                table: "Merchants",
                type: "nvarchar(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "EG",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldDefaultValue: "EG");
        }
    }
}
