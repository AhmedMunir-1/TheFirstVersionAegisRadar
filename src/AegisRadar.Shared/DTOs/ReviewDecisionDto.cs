namespace AegisRadar.Shared.DTOs;

public class ReviewDecisionDto
{
    public string Decision { get; set; } = "approved"; // "approved", "blocked"
    public string? Note { get; set; }
}
