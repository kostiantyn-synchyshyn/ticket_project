using Microsoft.EntityFrameworkCore;
using TicketProject.Data;
using TicketProject.Entities;

var builder = WebApplication.CreateBuilder(args);

// Get the PostgreSQL connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? throw new InvalidOperationException(
                           "Connection string 'DefaultConnection' not found."
                       );

// Connect Entity Framework Core to PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// OpenAPI only in development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Test database connection
app.MapGet("/test-db", async (ApplicationDbContext db) =>
{
    try
    {
        var projects = await db.Projects
            .Select(project => new
            {
                project.Id,
                project.ProjectKey,
                project.Name,
                project.ProjectAdmin,

                Tickets = db.Tickets
                    .Where(ticket => ticket.ProjectId == project.Id)
                    .ToList()
            })
            .ToListAsync();

        return Results.Ok(projects);
    }
    catch (Exception ex)
    {
        return Results.Problem(
            $"Database connection failed: {ex}"
        );
    }
});

app.Run();