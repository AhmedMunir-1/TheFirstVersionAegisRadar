using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AegisRadarDbContext Context;
    protected readonly DbSet<T> DbSet;

    public Repository(AegisRadarDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);
    }

    public void Update(T entity)
    {
        DbSet.Update(entity);
    }

    public void Remove(T entity)
    {
        DbSet.Remove(entity);
    }
}
