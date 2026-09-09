import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number>('SMTP_PORT', 587));
    const secure =
      this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendOtpEmail(
    to: string,
    otp: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      '"Gym Analytics" <noreply@gym-analytics.com>';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gym Analytics Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="520px" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #38bdf8;">
                GYM ANALYTICS
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">
                Body Progress & Performance Platform
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: 0; border-top: 1px solid #334155; margin: 0;">
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #f1f5f9;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Thank you for joining Gym Analytics. Please use the following 6-digit verification code to complete your registration:
              </p>
              <!-- OTP Box -->
              <div style="background-color: #0f172a; border-radius: 12px; border: 1px solid #0284c7; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">
                  ${otp}
                </span>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                This code is valid for <strong>${expiresInMinutes} minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                If you did not request this verification, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px 24px 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                &copy; ${new Date().getFullYear()} Gym Analytics. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const textContent = `Your Gym Analytics verification code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nIf you did not register for an account, please ignore this email.`;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `${otp} is your Gym Analytics verification code`,
        text: textContent,
        html: htmlContent,
      });
      this.logger.log(`OTP verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      throw new InternalServerErrorException({
        message: 'Failed to send verification email. Please try again later.',
        code: 'EMAIL_SEND_FAILED',
        errors: [],
      });
    }
  }
}
