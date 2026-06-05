using AegisRadar.Application.Interfaces;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Constants;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

namespace AegisRadar.API.Middleware;

/// <summary>Validates the X-API-Key header, authenticates the merchant, and adds merchant context to request.</summary>
public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyMiddleware> _logger;

    public ApiKeyMiddleware(RequestDelegate next, ILogger<ApiKeyMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IUnitOfWork uow, ICacheService cache)
    {
        // Only enforce on /api/transactions POST
        if (!context.Request.Path.StartsWithSegments("/api/transactions") ||
             context.Request.Method != "POST")
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("X-API-Key", out var apiKey) || string.IsNullOrWhiteSpace(apiKey))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { error = "X-API-Key header is missing." });
            return;
        }

        // Check cache first
        var cacheKey = CacheKeys.MerchantByApiKey(apiKey!);
        var merchantId = await cache.GetAsync<string>(cacheKey);

        if (merchantId is null)
        {
            var merchant = await uow.Merchants.GetByApiKeyAsync(apiKey!, context.RequestAborted);
            if (merchant is null)
            {
                _logger.LogWarning("Invalid API key attempt: {ApiKey}", (string?)apiKey);                
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid API key." });
                return;
            }

            merchantId = merchant.Id.ToString();
            await cache.SetAsync(cacheKey, merchantId, TimeSpan.FromMinutes(5));

            // Attach merchant data to items for downstream use
            context.Items["MerchantId"]      = merchant.Id;
            context.Items["MerchantCountry"] = merchant.Country;
            context.Items["PlanLimit"]       = merchant.Plan?.TransactionLimit ?? 5000;
        }
        else
        {
            context.Items["MerchantId"]      = Guid.Parse(merchantId);
            context.Items["MerchantCountry"] = "EG"; // Fallback; full merchant loaded when needed
            context.Items["PlanLimit"]       = 5000;
        }

        await _next(context);
    }
}

/// <summary>Global exception handling middleware — catches unhandled exceptions and returns RFC 7807 Problem Details.</summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

            context.Response.StatusCode  = 500;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new
            {
                type   = "https://tools.ietf.org/html/rfc7807",
                title  = "Internal Server Error",
                status = 500,
                detail = ex.Message,
                traceId = context.TraceIdentifier
            });
        }
    }
}
