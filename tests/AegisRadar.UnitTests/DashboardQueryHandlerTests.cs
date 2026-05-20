using AegisRadar.Application.DTOs;
using AegisRadar.Application.Features.Alerts.Queries;
using AegisRadar.Application.Features.Dashboard.Queries;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Application.Interfaces;
using Moq;

namespace AegisRadar.UnitTests;

public class DashboardQueryHandlerTests
{
    [Fact]
    public async Task GetDashboardStats_ReturnsCachedResult_WhenCacheHit()
    {
        // Arrange
        var uowMock   = new Mock<IUnitOfWork>();
        var cacheMock = new Mock<ICacheService>();
        var expected  = new DashboardStatsDto(10, 2, 1, 3, 70.0, 0.42, 15000m);

        cacheMock.Setup(c => c.GetAsync<DashboardStatsDto>(It.IsAny<string>(), default))
                 .ReturnsAsync(expected);

        var handler = new GetDashboardStatsQueryHandler(uowMock.Object, cacheMock.Object);

        // Act
        var result = await handler.Handle(new GetDashboardStatsQuery(Guid.NewGuid()), default);

        // Assert
        Assert.Equal(expected.TransactionsToday, result.TransactionsToday);
        uowMock.Verify(u => u.Transactions, Times.Never); // Cache hit — DB not called
    }

    [Fact]
    public async Task GetAlerts_ReturnsOnlyUnread_WhenUnreadOnlyTrue()
    {
        // Arrange
        var merchantId = Guid.NewGuid();
        var alerts = new List<Alert>
        {
            new() { Id = Guid.NewGuid(), MerchantId = merchantId, TransactionId = Guid.NewGuid(), Severity = AlertSeverity.High, Message = "Blocked", IsRead = false },
            new() { Id = Guid.NewGuid(), MerchantId = merchantId, TransactionId = Guid.NewGuid(), Severity = AlertSeverity.Medium, Message = "Review", IsRead = true }
        };

        var alertRepoMock = new Mock<IAlertRepository>();
        alertRepoMock.Setup(r => r.GetByMerchantIdAsync(merchantId, true, default))
                     .ReturnsAsync(alerts.Where(a => !a.IsRead));

        var uowMock = new Mock<IUnitOfWork>();
        uowMock.Setup(u => u.Alerts).Returns(alertRepoMock.Object);

        var handler = new GetAlertsQueryHandler(uowMock.Object);

        // Act
        var result = (await handler.Handle(new GetAlertsQuery(merchantId, true), default)).ToList();

        // Assert
        Assert.Single(result);
        Assert.False(result[0].IsRead);
    }
}
