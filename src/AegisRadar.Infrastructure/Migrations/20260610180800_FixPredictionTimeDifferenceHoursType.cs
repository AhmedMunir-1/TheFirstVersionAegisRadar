using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AegisRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPredictionTimeDifferenceHoursType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Change Predictions.TimeDifferenceHours from int (4 bytes) to float (8 bytes / double).
            // The original int? type was truncating sub-hour precision from the feature engineering service.
            migrationBuilder.AlterColumn<double>(
                name: "TimeDifferenceHours",
                table: "Predictions",
                type: "float",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "TimeDifferenceHours",
                table: "Predictions",
                type: "int",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "float",
                oldNullable: true);
        }
    }
}
