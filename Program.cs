using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Scalar.AspNetCore;
using TicketProject.Data;
using TicketProject.Entities;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' not found.");
}

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

var frontendPath = Path.Combine(
    builder.Environment.ContentRootPath,
    "Frontend");

app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = new PhysicalFileProvider(frontendPath)
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(frontendPath)
});

app.MapGet("/test-db", async (ApplicationDbContext db) =>
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
        .FirstOrDefaultAsync(project => project.Id == id);

    if (project is null)
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
        .Where(ticket => ticket.ProjectId == id)
        .ToListAsync();

    return Results.Ok(tickets);
});

app.MapPost("/tickets", async (
    CreateTicketRequest request,
    ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest("Title is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Summary))
    {
        return Results.BadRequest("Summary is required.");
    }

    var project = await db.Projects
        .FirstOrDefaultAsync(project => project.Id == request.ProjectId);

    if (project is null)
    {
        return Results.BadRequest("Choose an existing project.");
    }

    var creator = await db.Users
        .FirstOrDefaultAsync(user => user.Id == request.CreatorId);

    if (creator is null)
    {
        return Results.BadRequest("Choose an existing creator.");
    }

    if (request.AssigneeId.HasValue)
    {
        var assigneeExists = await db.Users
            .AnyAsync(user => user.Id == request.AssigneeId.Value);

        if (!assigneeExists)
        {
            return Results.BadRequest("Choose an existing assignee.");
        }
    }

    var ticket = new Ticket
    {
        Title = request.Title.Trim(),
        Summary = request.Summary.Trim(),
        Details = request.Details,
        Status = "To Do",
        ProjectId = project.Id,
        CreatorId = creator.Id,
        AssigneeId = request.AssigneeId,
        CreatedTime = DateTime.UtcNow
    };

    db.Tickets.Add(ticket);
    await db.SaveChangesAsync();

    ticket.TicketKey = project.ProjectKey + "-" + ticket.Id;
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
        .FirstOrDefaultAsync(ticket => ticket.Id == id);

    if (ticket is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(ticket);
});

app.MapPost("/users", async (
    User user,
    ApplicationDbContext db) =>
{
    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Created($"/users/{user.Id}", user);
});

app.MapGet("/users", async (ApplicationDbContext db) =>
{
    var users = await db.Users
        .Select(user => new
        {
            user.Id,
            user.Name,
            user.Email,
            user.UserType
        })
        .ToListAsync();

    return Results.Ok(users);
});

app.Run();

public class CreateTicketRequest
{
    public string Title { get; set; } = "";
    public string Summary { get; set; } = "";
    public string? Details { get; set; }
    public int ProjectId { get; set; }
    public int CreatorId { get; set; }
    public int? AssigneeId { get; set; }
}