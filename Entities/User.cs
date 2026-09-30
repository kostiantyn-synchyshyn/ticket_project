using System.ComponentModel.DataAnnotations.Schema;
namespace TicketProject.Entities;

[Table("users")]
public class User
{
    [Column("id")]
    public int Id { get; set; }

    [Column("email")]
    public string Email { get; set; } = null!;
    
    [Column("name")]
    public string Name { get; set; } = null!;
    
    [Column("user_type")]
    public string UserType { get; set; } = null!;

    [Column("password")]
    public string Password { get; set; } = null!;
}