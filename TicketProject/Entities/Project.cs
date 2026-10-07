using System.ComponentModel.DataAnnotations.Schema;

namespace TicketProject.Entities;

[Table("project")]
public class Project
{
    [Column("id")]
    public int Id { get; set; }

    [Column("project_key")]
    public string? ProjectKey { get; set; }

    [Column("name")]
    public string Name { get; set; } = "";

    [Column("project_admin")]
    public string? ProjectAdmin { get; set; }

    [Column("created_time")]
    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
}