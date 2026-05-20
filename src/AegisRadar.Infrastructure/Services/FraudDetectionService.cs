using AegisRadar.Application.DTOs;
using AegisRadar.Application.Interfaces;
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
        _http     = http;
        _settings = settings.Value;
        _logger   = logger;
    }

    public async Task<FraudPredictionResultDto> PredictAsync(
        FraudFeaturePayloadDto features,
        CancellationToken cancellationToken = default)
    {
        // Build the exact payload the AI API expects
        var payload = new
        {
            amount_ratio           = features.AmountRatio,
            Hour                   = features.Hour,
            is_foreign             = features.IsForeign,
            user_degree            = features.UserDegree,
            merchant_degree        = features.MerchantDegree,
            MCC                    = features.MCC,
            User_Frequency_Per_Day = features.UserFrequencyPerDay,
            Time_Difference_Hours  = features.TimeDifferenceHours
        };

        _logger.LogInformation(
            "Calling AI API at {Url}{Endpoint} with features: {@Features}",
            _settings.BaseUrl, _settings.PredictEndpoint, payload);

        try
        {
            var response = await _http.PostAsJsonAsync(
                _settings.PredictEndpoint, payload, cancellationToken);

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
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "AI API unreachable at {Url}. Defaulting decision to 'review'.",
                _settings.BaseUrl + _settings.PredictEndpoint);

            // Safe fallback: treat as review if AI API is unavailable
            return new FraudPredictionResultDto(0.5, "review");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling AI API. Defaulting to 'review'.");
            return new FraudPredictionResultDto(0.5, "review");
        }
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
