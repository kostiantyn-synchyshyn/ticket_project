using Microsoft.EntityFrameworkCore;
using TicketProject.Data;
using Scalar.AspNetCore;
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

// OpenAPI and Scalar only in development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
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

// post projects 
app.MapPost("/projects", async (
    Project project,
    ApplicationDbContext db) =>
{
    db.Projects.Add(project);
    await db.SaveChangesAsync();

    return Results.Created($"/projects/{project.Id}", project);
});

// get projects
app.MapGet("/projects", async (ApplicationDbContext db) =>
{
    var projects = await db.Projects.ToListAsync();

    return Results.Ok(projects);
});

// get specific projects id
app.MapGet("/projects/{id}", async (
    int id,
    ApplicationDbContext db) =>
{
    var project = await db.Projects
        .FirstOrDefaultAsync(p => p.Id == id);

    if (project == null)
    {
        return Results.NotFound();
    }

    return Results.Ok(project);
});

// get tickets related to a project id
app.MapGet("/projects/{id}/tickets", async (
    int id,
    ApplicationDbContext db) =>
{
    var tickets = await db.Tickets
        .Where(t => t.ProjectId == id)
        .ToListAsync();

    return Results.Ok(tickets);
});

// post tickets
app.MapPost("/tickets", async (
    Ticket ticket,
    ApplicationDbContext db) =>
{
    db.Tickets.Add(ticket);
    await db.SaveChangesAsync();

    return Results.Created($"/tickets/{ticket.Id}", ticket);
});

// get tickets
app.MapGet("/tickets", async (ApplicationDbContext db) =>
{
    var tickets = await db.Tickets.ToListAsync();

    return Results.Ok(tickets);
});

// get tickets id
app.MapGet("/tickets/{id}", async (
    int id,
    ApplicationDbContext db) =>
{
    var ticket = await db.Tickets
        .FirstOrDefaultAsync(t => t.Id == id);

    if (ticket == null)
    {
        return Results.NotFound();
    }

    return Results.Ok(ticket);
});


app.Run();