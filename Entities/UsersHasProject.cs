using System.ComponentModel.DataAnnotations.Schema;
namespace TicketProject.Entities;

[Table("users_has_project")]
public class UserHasProject
{
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("project_id")]
    public int ProjectId { get; set; }

    [Column("id")]
    public int Id { get; set; }
}