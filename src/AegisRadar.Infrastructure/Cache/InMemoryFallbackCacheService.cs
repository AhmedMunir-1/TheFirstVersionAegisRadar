using AegisRadar.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace AegisRadar.Infrastructure.Cache;

/// <summary>
/// In-memory fallback cache used when Redis is unavailable (e.g. local dev without Docker).
/// Data is stored per-process only — not shared across instances.
/// Replace with the real RedisCacheService in any multi-instance deployment.
/// </summary>
public class InMemoryFallbackCacheService : ICacheService
{
    private readonly IMemoryCache _cache;

    public InMemoryFallbackCacheService()
    {
        _cache = new MemoryCache(new MemoryCacheOptions());
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        _cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        var options = new MemoryCacheEntryOptions();
        if (expiry.HasValue)
            options.AbsoluteExpirationRelativeToNow = expiry.Value;
        _cache.Set(key, value, options);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _cache.Remove(key);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_cache.TryGetValue(key, out _));
    }
}
