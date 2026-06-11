using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace AegisRadar.Infrastructure.Services;

public interface IEmailService
{
    Task SendInvitationEmailAsync(string toEmail, string memberName, string inviteLink, string role);
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
}

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _smtpUsername;
    private readonly string _smtpPassword;
    private readonly string _senderEmail;
    private readonly string _senderName;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

        // Try Gmail SMTP first (most accessible)
        _smtpHost = configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
        _smtpPort = int.Parse(configuration["Email:SmtpPort"] ?? "587");
        _smtpUsername = configuration["Email:SmtpUsername"] ?? "";
        _smtpPassword = configuration["Email:SmtpPassword"] ?? "";
        _senderEmail = configuration["Email:SenderEmail"] ?? "noreply@aegisradar.com";
        _senderName = configuration["Email:SenderName"] ?? "AegisRadar";

        if (string.IsNullOrEmpty(_smtpUsername) || string.IsNullOrEmpty(_smtpPassword))
        {
            _logger.LogWarning("⚠️ Email service not configured. Set Email:SmtpUsername and Email:SmtpPassword in appsettings");
        }
    }

    public async Task SendInvitationEmailAsync(string toEmail, string memberName, string inviteLink, string role)
    {
        try
        {
            if (string.IsNullOrEmpty(_smtpUsername) || string.IsNullOrEmpty(_smtpPassword))
            {
                _logger.LogWarning($"Email service not configured. Invitation would be sent to: {toEmail}");
                return;
            }

            using (var client = new SmtpClient(_smtpHost, _smtpPort))
            {
                client.EnableSsl = true;
                client.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);
                client.Timeout = 10000;

                var subject = "You're Invited to AegisRadar";
                var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to AegisRadar</h1>
        </div>
        <div class='content'>
            <p>Hi {memberName},</p>
            <p>You have been invited to join the AegisRadar team as a <strong>{role}</strong>.</p>
            <p>Click the button below to accept your invitation and set up your account:</p>
            <a href='{inviteLink}' class='button'>Accept Invitation</a>
            <p>Or copy this link in your browser:</p>
            <p><small>{inviteLink}</small></p>
            <p>If you didn't expect this invitation, please ignore this email.</p>
            <p>Best regards,<br>The AegisRadar Team</p>
        </div>
        <div class='footer'>
            <p>&copy; 2026 AegisRadar. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_senderEmail, _senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"✅ Invitation email sent successfully to {toEmail}");
            }
        }
        catch (SmtpException ex)
        {
            _logger.LogError($"❌ SMTP Error sending email to {toEmail}: {ex.Message}");
            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error sending email to {toEmail}: {ex.Message}");
            throw;
        }
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
        try
        {
            if (string.IsNullOrEmpty(_smtpUsername) || string.IsNullOrEmpty(_smtpPassword))
            {
                _logger.LogWarning($"Email service not configured. Reset link would be sent to: {toEmail}");
                return;
            }

            using (var client = new SmtpClient(_smtpHost, _smtpPort))
            {
                client.EnableSsl = true;
                client.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);
                client.Timeout = 10000;

                var subject = "Password Reset - AegisRadar";
                var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
        .warning {{ background: #ffe6e6; padding: 10px; border-radius: 4px; color: #c33; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Password Reset Request</h1>
        </div>
        <div class='content'>
            <p>Hi,</p>
            <p>We received a request to reset your AegisRadar password.</p>
            <a href='{resetLink}' class='button'>Reset Password</a>
            <p>Or copy this link in your browser:</p>
            <p><small>{resetLink}</small></p>
            <div class='warning'>
                <strong>⚠️ Important:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.
            </div>
            <p>Best regards,<br>The AegisRadar Team</p>
        </div>
    </div>
</body>
</html>";

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_senderEmail, _senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"✅ Password reset email sent to {toEmail}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error sending password reset email to {toEmail}: {ex.Message}");
            throw;
        }
    }
}
