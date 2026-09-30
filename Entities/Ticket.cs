using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TicketProject.Entities;

[Table("ticket")]
public class Ticket
{
    [Column("id")]
    public int Id { get; set; }

    [Column("ticket_key")]
    public string? TicketKey { get; set; }

    [Column("details")]
    public string? Details { get; set; }

    [Column("status")]
    public string? Status { get; set; }

    [Column("created_time")]
    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;

    [Column("title")]
    public string? Title { get; set; } = "";

    [Column("summary")]
    public string? Summary { get; set; } = "";

    [Column("updated_time")]
    public DateTime? UpdatedTime { get; set; }
    
// foreign keys    
    [Column("creator_id")]
    public int CreatorId { get; set; }

    [Column("assignee_id")]
    public int? AssigneeId { get; set; }

    [Column("project_id")]
    public int ProjectId { get; set; }
    
// relationships
    [JsonIgnore]
    public User Creator { get; set; } = null!;
    
    [JsonIgnore]
    public User? Assignee { get; set; }
    
    [JsonIgnore]
    public Project Project { get; set; } = null!;
}