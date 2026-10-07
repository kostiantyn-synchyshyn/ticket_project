using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
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

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
    });

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

var app = builder.Build();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/users", async (
    RegisterRequest request,
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest("Name is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest("Email is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest("Password is required.");
    }

    if (request.Password.Length < 8)
    {
        return Results.BadRequest(
            "Password must be at least 8 characters.");
    }

    var email = request.Email.Trim();

    var emailAlreadyExists = await db.Users
        .AnyAsync(user => user.Email.ToLower() == email.ToLower());

    if (emailAlreadyExists)
    {
        return Results.Conflict("This email is already registered.");
    }

    var user = new User
    {
        Name = request.Name.Trim(),
        Email = email,
        UserType = "User"
    };

    user.Password = passwordHasher.HashPassword(user, request.Password);

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Created($"/users/{user.Id}", new
    {
        user.Id,
        user.Name,
        user.Email,
        user.UserType
    });
});

app.MapPost("/login", async (
    LoginRequest request,
    ApplicationDbContext db,
    HttpContext httpContext,
    IPasswordHasher<User> passwordHasher) =>
{
    if (string.IsNullOrWhiteSpace(request.Email)
        || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest("Email and password are required.");
    }

    var email = request.Email.Trim().ToLower();

    var user = await db.Users
        .FirstOrDefaultAsync(user => user.Email.ToLower() == email);

    if (user is null || string.IsNullOrEmpty(user.Password))
    {
        return Results.Unauthorized();
    }

    PasswordVerificationResult verification;

    try
    {
        verification = passwordHasher.VerifyHashedPassword(
            user,
            user.Password,
            request.Password);
    }
    catch (FormatException)
    {
        return Results.Unauthorized();
    }

    if (verification == PasswordVerificationResult.Failed)
    {
        return Results.Unauthorized();
    }

    if (verification == PasswordVerificationResult.SuccessRehashNeeded)
    {
        user.Password = passwordHasher.HashPassword(
            user,
            request.Password);

        await db.SaveChangesAsync();
    }

    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Name),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.UserType)
    };

    var identity = new ClaimsIdentity(
        claims,
        CookieAuthenticationDefaults.AuthenticationScheme);

    await httpContext.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        new ClaimsPrincipal(identity));

    return Results.Ok(new { user.Name });
});

// Log out
app.MapPost("/logout", async (HttpContext httpContext) =>
{
    await httpContext.SignOutAsync(
        CookieAuthenticationDefaults.AuthenticationScheme);

    return Results.Ok();
});

// Project overview for main page
app.MapGet("/projects", async (ApplicationDbContext db) =>
{
    var projects = await db.Projects
        .OrderByDescending(project => project.CreatedTime)
        .ThenByDescending(project => project.Id)
        .Select(project => new
        {
            project.Id,
            project.ProjectKey,
            project.Name,
            project.ProjectAdmin,
            project.CreatedTime,
            Tickets = db.Tickets
                .Where(ticket => ticket.ProjectId == project.Id)
                .OrderByDescending(ticket => ticket.CreatedTime)
                .ThenByDescending(ticket => ticket.Id)
                .Select(ticket => new
                {
                    ticket.Id,
                    ticket.TicketKey,
                    ticket.Title,
                    ticket.Summary,
                    ticket.Status,
                    ticket.CreatedTime
                })
                .ToList()
        })
        .ToListAsync();

    return Results.Ok(projects);
});

// one project and its tickets for project page
app.MapGet("/projects/{id:int}", async (
    int id,
    ApplicationDbContext db) =>
{
    var project = await db.Projects
        .Where(project => project.Id == id)
        .Select(project => new
        {
            project.Id,
            project.ProjectKey,
            project.Name,
            project.ProjectAdmin,
            Tickets = db.Tickets
                .Where(ticket => ticket.ProjectId == project.Id)
                .OrderByDescending(ticket => ticket.CreatedTime)
                .ThenByDescending(ticket => ticket.Id)
                .Select(ticket => new
                {
                    ticket.Id,
                    ticket.TicketKey,
                    ticket.Title,
                    ticket.Summary,
                    ticket.Status,
                    AssigneeName = ticket.Assignee == null
                        ? null
                        : ticket.Assignee.Name
                })
                .ToList()
        })
        .FirstOrDefaultAsync();

    if (project is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(project);
});

// Create a project
app.MapPost("/projects", async (
    Project project,
    ApplicationDbContext db) =>
{
    project.CreatedTime = DateTime.UtcNow;

    db.Projects.Add(project);
    await db.SaveChangesAsync();

    return Results.Created($"/projects/{project.Id}", project);
})
.RequireAuthorization();

// List tickets belonging to a project
app.MapGet("/projects/{id}/tickets", async (
    int id,
    ApplicationDbContext db) =>
{
    var tickets = await db.Tickets
        .Where(ticket => ticket.ProjectId == id)
        .OrderByDescending(ticket => ticket.CreatedTime)
        .ThenByDescending(ticket => ticket.Id)
        .ToListAsync();

    return Results.Ok(tickets);
});

// Create a ticket
app.MapPost("/tickets", async (
    CreateTicketRequest request,
    ClaimsPrincipal currentUser,
    ApplicationDbContext db) =>
{
    var userIdText = currentUser.FindFirstValue(ClaimTypes.NameIdentifier);

    if (!int.TryParse(userIdText, out var creatorId))
    {
        return Results.Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Title)
        || string.IsNullOrWhiteSpace(request.Summary))
    {
        return Results.BadRequest("Title and summary are required.");
    }

    var project = await db.Projects
        .FirstOrDefaultAsync(project => project.Id == request.ProjectId);

    if (project is null)
    {
        return Results.BadRequest("Choose an existing project.");
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
        CreatorId = creatorId,
        AssigneeId = request.AssigneeId,
        CreatedTime = DateTime.UtcNow
    };

    db.Tickets.Add(ticket);
    await db.SaveChangesAsync();

    ticket.TicketKey = project.ProjectKey + "-" + ticket.Id;
    await db.SaveChangesAsync();

    return Results.Created($"/tickets/{ticket.Id}", ticket);
})
.RequireAuthorization();

// Ticket details
app.MapGet("/tickets/{id}", async (
    int id,
    ApplicationDbContext db) =>
{
    var ticket = await db.Tickets
        .Where(ticket => ticket.Id == id)
        .Select(ticket => new
        {
            ticket.Id,
            ticket.TicketKey,
            ticket.Title,
            ticket.Summary,
            ticket.Details,
            ticket.Status,
            ticket.CreatedTime,
            ProjectName = ticket.Project.Name,
            ticket.ProjectId,
            ticket.AssigneeId,
            AssigneeName = ticket.Assignee == null
                ? null
                : ticket.Assignee.Name
        })
        .FirstOrDefaultAsync();

    if (ticket is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(ticket);
});

// Update ticket status
app.MapPut("/tickets/{id}/status", async (
    int id,
    UpdateTicketStatusRequest request,
    ApplicationDbContext db) =>
{
    var validStatuses = new[] { "To Do", "In Progress", "Done" };

    if (!validStatuses.Contains(request.Status))
    {
        return Results.BadRequest(
            "Status must be To Do, In Progress, or Done.");
    }

    var ticket = await db.Tickets
        .FirstOrDefaultAsync(ticket => ticket.Id == id);

    if (ticket is null)
    {
        return Results.NotFound();
    }

    ticket.Status = request.Status;
    ticket.UpdatedTime = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(new { ticket.Id, ticket.Status });
})
.RequireAuthorization();

// Users available in the assignee dropdown
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

public class RegisterRequest
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class CreateTicketRequest
{
    public string Title { get; set; } = "";
    public string Summary { get; set; } = "";
    public string? Details { get; set; }
    public int ProjectId { get; set; }
    public int? AssigneeId { get; set; }
}

public class UpdateTicketStatusRequest
{
    public string Status { get; set; } = "";
}