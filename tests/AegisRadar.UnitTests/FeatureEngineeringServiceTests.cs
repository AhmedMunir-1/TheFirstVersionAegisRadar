using AegisRadar.Application.DTOs;
using AegisRadar.Infrastructure.Services;
using AegisRadar.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;

namespace AegisRadar.UnitTests;

public class FeatureEngineeringServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<ILogger<FeatureEngineeringService>> _loggerMock = new();
    private readonly Mock<ITransactionRepository> _txRepoMock = new();

    private FeatureEngineeringService CreateService()
    {
        _uowMock.Setup(u => u.Transactions).Returns(_txRepoMock.Object);
        return new FeatureEngineeringService(_uowMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task ComputeFeatures_SameCountry_IsForeignZero()
    {
        // Arrange
        _txRepoMock.Setup(r => r.GetAverageAmountByCustomerAsync(It.IsAny<string>(), default)).ReturnsAsync(500.0);
        _txRepoMock.Setup(r => r.GetUserDegreeAsync(It.IsAny<string>(), default)).ReturnsAsync(3);
        _txRepoMock.Setup(r => r.GetMerchantDegreeAsync(It.IsAny<Guid>(), default)).ReturnsAsync(120);
        _txRepoMock.Setup(r => r.GetUserFrequencyTodayAsync(It.IsAny<string>(), default)).ReturnsAsync(2);
        _txRepoMock.Setup(r => r.GetLastTransactionTimeAsync(It.IsAny<string>(), default)).ReturnsAsync(DateTime.UtcNow.AddHours(-3));

        var svc = CreateService();

        // Act
        var features = await svc.ComputeFeaturesAsync(
            Guid.NewGuid(), "cust_001", 500m, "EG", "EG", 5411, DateTime.UtcNow);

        // Assert
        Assert.Equal(0, features.IsForeign);
    }

    [Fact]
    public async Task ComputeFeatures_DifferentCountry_IsForeignOne()
    {
        _txRepoMock.Setup(r => r.GetAverageAmountByCustomerAsync(It.IsAny<string>(), default)).ReturnsAsync(200.0);
        _txRepoMock.Setup(r => r.GetUserDegreeAsync(It.IsAny<string>(), default)).ReturnsAsync(1);
        _txRepoMock.Setup(r => r.GetMerchantDegreeAsync(It.IsAny<Guid>(), default)).ReturnsAsync(50);
        _txRepoMock.Setup(r => r.GetUserFrequencyTodayAsync(It.IsAny<string>(), default)).ReturnsAsync(1);
        _txRepoMock.Setup(r => r.GetLastTransactionTimeAsync(It.IsAny<string>(), default)).ReturnsAsync((DateTime?)null);

        var svc = CreateService();

        var features = await svc.ComputeFeaturesAsync(
            Guid.NewGuid(), "cust_002", 200m, "US", "EG", 5412, DateTime.UtcNow);

        Assert.Equal(1, features.IsForeign);
        Assert.Equal(999.0, features.TimeDifferenceHours); // No prior tx
    }

    [Fact]
    public async Task ComputeFeatures_AmountRatio_CalculatesCorrectly()
    {
        _txRepoMock.Setup(r => r.GetAverageAmountByCustomerAsync(It.IsAny<string>(), default)).ReturnsAsync(100.0);
        _txRepoMock.Setup(r => r.GetUserDegreeAsync(It.IsAny<string>(), default)).ReturnsAsync(5);
        _txRepoMock.Setup(r => r.GetMerchantDegreeAsync(It.IsAny<Guid>(), default)).ReturnsAsync(200);
        _txRepoMock.Setup(r => r.GetUserFrequencyTodayAsync(It.IsAny<string>(), default)).ReturnsAsync(0);
        _txRepoMock.Setup(r => r.GetLastTransactionTimeAsync(It.IsAny<string>(), default)).ReturnsAsync(DateTime.UtcNow.AddHours(-1));

        var svc = CreateService();

        var features = await svc.ComputeFeaturesAsync(
            Guid.NewGuid(), "cust_003", 350m, "EG", "EG", 5411, DateTime.UtcNow);

        Assert.Equal(3.5, features.AmountRatio);
    }

    [Fact]
    public async Task ComputeFeatures_Hour_ExtractedFromTimestamp()
    {
        _txRepoMock.Setup(r => r.GetAverageAmountByCustomerAsync(It.IsAny<string>(), default)).ReturnsAsync(500.0);
        _txRepoMock.Setup(r => r.GetUserDegreeAsync(It.IsAny<string>(), default)).ReturnsAsync(1);
        _txRepoMock.Setup(r => r.GetMerchantDegreeAsync(It.IsAny<Guid>(), default)).ReturnsAsync(10);
        _txRepoMock.Setup(r => r.GetUserFrequencyTodayAsync(It.IsAny<string>(), default)).ReturnsAsync(0);
        _txRepoMock.Setup(r => r.GetLastTransactionTimeAsync(It.IsAny<string>(), default)).ReturnsAsync(DateTime.UtcNow.AddHours(-2));

        var svc = CreateService();
        var txTime = new DateTime(2024, 6, 15, 3, 30, 0, DateTimeKind.Utc); // 3 AM

        var features = await svc.ComputeFeaturesAsync(
            Guid.NewGuid(), "cust_004", 500m, "EG", "EG", 5411, txTime);

        Assert.Equal(3, features.Hour);
    }
}
