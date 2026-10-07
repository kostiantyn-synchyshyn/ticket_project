using Microsoft.EntityFrameworkCore;
using TicketProject.Entities;

namespace TicketProject.Data;
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<UserHasProject> UserHasProjects { get; set; }
    
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Project)
            .WithMany()
            .HasForeignKey(t => t.ProjectId);
    }
}