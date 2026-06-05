using System.Text.Json;
using AegisRadar.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace AegisRadar.Infrastructure.Cache;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _multiplexer;
    private readonly IDatabase _database;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

    public RedisCacheService(IConnectionMultiplexer multiplexer, ILogger<RedisCacheService> logger)
    {
        ArgumentNullException.ThrowIfNull(multiplexer, nameof(multiplexer));
        ArgumentNullException.ThrowIfNull(logger, nameof(logger));

        _multiplexer = multiplexer;
        _database = multiplexer.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var value = await _database.StringGetAsync(key);
            if (!value.HasValue)
                return default;

            return JsonSerializer.Deserialize<T>(value.ToString(), _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Redis get failed for key '{Key}'. Falling back to no-cache behavior.", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var data = JsonSerializer.Serialize(value, _jsonOptions);
            if (expiry.HasValue)
            {
                await _database.StringSetAsync(key, data, new Expiration(expiry.Value));
            }
            else
            {
                await _database.StringSetAsync(key, data);
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Redis set failed for key '{Key}'. Skipping cache write.", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _database.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Redis remove failed for key '{Key}'.", key);
        }
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _database.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Redis exists check failed for key '{Key}'. Returning false.", key);
            return false;
        }
    }
}
