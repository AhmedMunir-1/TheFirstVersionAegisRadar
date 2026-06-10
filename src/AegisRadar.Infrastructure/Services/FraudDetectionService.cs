using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AegisRadar.Infrastructure.Services;

/// <summary>
/// Configuration for the external AI fraud detection API.
/// Set AiService:BaseUrl and AiService:PredictEndpoint in appsettings.
/// </summary>
public class AiServiceSettings
{
    public string BaseUrl { get; set; } = "http://localhost:8000";
    public string PredictEndpoint { get; set; } = "/predict";
}

/// <summary>
/// Sends 8 engineered fraud features to an external AI API and retrieves a fraud decision.
///
/// Expected request body (sent to AI API):
/// {
///   "amount_ratio": 1.5,
///   "Hour": 14,
///   "is_foreign": 0,
///   "user_degree": 3,
///   "merchant_degree": 120,
///   "MCC": 5411,
///   "User_Frequency_Per_Day": 2,
///   "Time_Difference_Hours": 6.5
/// }
///
/// Expected response from AI API:
/// {
///   "fraud_probability": 0.82,
///   "decision": "blocked"   // "approved" | "review" | "blocked"
/// }
/// </summary>
public class FraudDetectionService : IFraudDetectionService
{
    private readonly HttpClient _http;
    private readonly AiServiceSettings _settings;
    private readonly ILogger<FraudDetectionService> _logger;

    public FraudDetectionService(
        HttpClient http,
        IOptions<AiServiceSettings> settings,
        ILogger<FraudDetectionService> logger)
    {
        _http = http;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<FraudPredictionResultDto> PredictAsync(
        FraudFeaturePayloadDto features,
        CancellationToken cancellationToken = default)
    {
        // Build the exact payload the AI API expects
        var payload = new
        {
            amount_ratio = features.AmountRatio,
            Hour = features.Hour,
            is_foreign = features.IsForeign,
            user_degree = features.UserDegree,
            merchant_degree = features.MerchantDegree,
            MCC = features.MCC,
            User_Frequency_Per_Day = features.UserFrequencyPerDay,
            Time_Difference_Hours = features.TimeDifferenceHours,
            Card = 0
        };

        _logger.LogInformation(
            "Calling AI API at {Url}{Endpoint} with features: {@Features}",
            _settings.BaseUrl, _settings.PredictEndpoint, payload);

        try
        {
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = null
            };

            var response = await _http.PostAsJsonAsync(
                _settings.PredictEndpoint, payload, jsonOptions, cancellationToken);
                
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<AiApiResponse>(
                cancellationToken: cancellationToken);

            if (result is null)
                throw new InvalidOperationException("AI API returned an empty response.");

            _logger.LogInformation(
                "AI API response: probability={Prob:F4}, decision={Decision}",
                result.FraudProbability, result.Decision);

            return new FraudPredictionResultDto(result.FraudProbability, result.Decision);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.UnprocessableEntity)
        {
            _logger.LogWarning(
                "AI API rejected payload (422). Using rule-based detection fallback. Error: {Error}",
                ex.Message);
            return CalculateFraudProbabilityUsingRules(features);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "AI API unreachable at {Url}. Using rule-based detection fallback.",
                _settings.BaseUrl + _settings.PredictEndpoint);

            // Safe fallback: use rule-based detection if AI API is unavailable
            return CalculateFraudProbabilityUsingRules(features);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling AI API. Using rule-based detection fallback.");
            return CalculateFraudProbabilityUsingRules(features);
        }
    }

    /// <summary>
    /// Rule-based fraud detection fallback when AI service is unavailable.
    /// Uses transaction features to estimate fraud probability.
    /// </summary>
    private FraudPredictionResultDto CalculateFraudProbabilityUsingRules(FraudFeaturePayloadDto features)
    {
        double fraudScore = 0.0;
        int ruleCount = 0;

        // Rule 1: High merchant degree suggests established merchant (lower fraud)
        if (features.MerchantDegree > 100)
            fraudScore -= 0.15;
        else if (features.MerchantDegree < 5)
            fraudScore += 0.20;
        ruleCount++;

        // Rule 2: Foreign transaction flag
        if (features.IsForeign == 1)
            fraudScore += 0.15;
        ruleCount++;

        // Rule 3: User frequency per day (multiple transactions in short time)
        if (features.UserFrequencyPerDay > 5)
            fraudScore += 0.10;
        else if (features.UserFrequencyPerDay == 0)
            fraudScore += 0.05;
        ruleCount++;

        // Rule 4: Large amount ratio compared to user's typical behavior
        if (features.AmountRatio > 2.0)
            fraudScore += 0.20;
        else if (features.AmountRatio > 1.5)
            fraudScore += 0.10;
        else if (features.AmountRatio < 0.5)
            fraudScore -= 0.10;
        ruleCount++;

        // Rule 5: Time difference - unusual hours
        int hour = features.Hour;
        if (hour >= 22 || hour <= 4)  // Night transactions
            fraudScore += 0.08;
        ruleCount++;

        // Rule 6: User degree (first-time user risky)
        if (features.UserDegree == 1)
            fraudScore += 0.12;
        else if (features.UserDegree < 3)
            fraudScore += 0.05;
        ruleCount++;

        // Rule 7: MCC (Merchant Category Code) - some MCCs are riskier
        // Gas stations, ATMs, etc. have higher fraud rates
        int[] riskyMCCs = { 6211, 6051, 7995, 6051, 4722 }; // Financial, gas, etc.
        if (riskyMCCs.Contains(features.MCC))
            fraudScore += 0.10;
        ruleCount++;

        // Normalize fraud score to 0-1 range
        double probability = Math.Min(1.0, Math.Max(0.0, fraudScore / 2.0 + 0.15));

        // Determine decision based on probability with more aggressive thresholds
        // Lower threshold for auto-approval, easier to block known fraud patterns
        string decision = probability switch
        {
            >= 0.65 => "blocked",
            <= 0.35 => "approved",
            _ => "review"
        };

        _logger.LogInformation(
            "Rule-based fraud detection: probability={Prob:F4}, decision={Decision}",
            probability, decision);

        return new FraudPredictionResultDto(probability, decision);
    }

    // ── Matches the JSON response shape from the AI API ──────────────────────
    private sealed class AiApiResponse
    {
        [JsonPropertyName("fraud_probability")]
        public double FraudProbability { get; set; }

        [JsonPropertyName("decision")]
        public string Decision { get; set; } = "review";
    }
}
