using AegisRadar.Application.DTOs;
using AegisRadar.Application.Features.Payments.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("initiate")]
    [Authorize]
    public async Task<IActionResult> Initiate([FromBody] CreatePaymentDto dto)
    {
        var result = await _mediator.Send(new InitiatePaymentCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("process")]
    [Authorize]
    public async Task<IActionResult> Process([FromBody] ProcessPaymentDto dto)
    {
        var result = await _mediator.Send(new ProcessPaymentCommand(dto));
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        // Simple retrieval via UnitOfWork
        return NotFound();
    }
}
