using AegisRadar.Application.Interfaces;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace AegisRadar.Infrastructure.Services;

public class EmailSettings
{
    public string SmtpHost { get; set; } = "localhost";
    public int SmtpPort { get; set; } = 25;
    public bool UseSsl { get; set; } = false;
    public string? SmtpUser { get; set; }
    public string? SmtpPass { get; set; }
    public string FromName { get; set; } = "AegisRadar";
    public string FromEmail { get; set; } = "no-reply@aegisradar.io";
}

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public SmtpEmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        using var msg = new MailMessage();
        msg.From = new MailAddress(_settings.FromEmail, _settings.FromName);
        msg.To.Add(new MailAddress(toEmail));
        msg.Subject = subject;
        msg.IsBodyHtml = true;
        msg.Body = htmlBody;

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.UseSsl
        };

        if (!string.IsNullOrEmpty(_settings.SmtpUser))
        {
            client.Credentials = new NetworkCredential(_settings.SmtpUser, _settings.SmtpPass);
        }

        await client.SendMailAsync(msg, cancellationToken);
    }
}
