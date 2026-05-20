namespace AegisRadar.Shared.Constants;

public static class KafkaTopics
{
    public const string Transactions = "aegis-transactions";
}

public static class CacheKeys
{
    public static string DashboardStats(Guid merchantId) => $"dashboard:stats:{merchantId}";
    public static string MerchantByApiKey(string apiKey) => $"merchant:apikey:{apiKey}";
    public static string AlertCount(Guid merchantId) => $"alerts:unread:{merchantId}";
    public static string FraudTrends(Guid merchantId) => $"dashboard:trends:{merchantId}";
}

public static class SignalRMethods
{
    public const string FraudAlertReceived = "FraudAlertReceived";
    public const string TransactionUpdated = "TransactionUpdated";
    public const string DashboardRefresh = "DashboardRefresh";
}

public static class Roles
{
    public const string Admin = "Admin";
    public const string Viewer = "Viewer";
}

public static class SubscriptionPlanNames
{
    public const string Starter = "Starter";
    public const string Business = "Business";
    public const string Enterprise = "Enterprise";
}
