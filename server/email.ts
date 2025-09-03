import { MailService } from '@sendgrid/mail';

function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://pingjob.com';
  }
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS}`;
  }
  return 'http://localhost:5000';
}

let mailService: MailService | null = null;

if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️  SENDGRID_API_KEY not set - email functionality will be disabled");
} else {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid service initialized');
}

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.log('📧 Email sending disabled - SendGrid not configured');
    return false;
  }
  
  try {
    const fromEmail = params.from || process.env.SENDGRID_VERIFIED_SENDER_EMAIL || 'noreply@pingjob.com';
    console.log('📧 Attempting to send email via SendGrid...', {
      to: params.to,
      from: fromEmail,
      subject: params.subject
    });
    
    await mailService.send({
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log('✅ Email sent successfully via SendGrid');
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error:', error);
    console.error('Error details:', {
      code: (error as any).code,
      message: (error as any).message,
      response: (error as any).response?.body
    });
    
    // Handle common SendGrid errors:
    if ((error as any).code === 401) {
      console.error('🔑 SendGrid 401 Unauthorized - Common causes:');
      console.error('1. Invalid or expired API key');
      console.error('2. Unverified sender email address');
      console.error('3. API key lacks Mail Send permissions');
      console.error('Check your SendGrid dashboard: https://app.sendgrid.com/');
    } else if ((error as any).code === 403) {
      console.error('🚫 SendGrid 403 Forbidden - Sender verification required:');
      console.error(`1. The sender email "${params.from}" is not verified in SendGrid`);
      console.error('2. Go to SendGrid Dashboard → Settings → Sender Authentication');
      console.error('3. Verify your sender email or use a verified sender');
      console.error('4. Or set SENDGRID_VERIFIED_SENDER_EMAIL environment variable');
      console.error('SendGrid Dashboard: https://app.sendgrid.com/settings/sender_auth');
    }
    
    return false;
  }
}

export async function sendInvitationEmail(
  recipientEmail: string,
  recipientName: string,
  inviterName: string,
  inviteToken: string,
  message?: string | null
): Promise<boolean> {
  const inviteUrl = `${getBaseUrl()}/invite/${inviteToken}`;
  
  const subject = `${inviterName} invited you to join PingJob`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">You're invited to join PingJob!</h2>
      
      <p>Hi ${recipientName},</p>
      
      <p><strong>${inviterName}</strong> has invited you to join PingJob, a professional networking platform for job seekers and industry professionals.</p>
      
      ${message ? `<div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
        <p style="margin: 0; font-style: italic;">"${message}"</p>
      </div>` : ''}
      
      <p>PingJob helps you:</p>
      <ul>
        <li>Connect with industry professionals</li>
        <li>Discover job opportunities from top companies</li>
        <li>Build your professional network</li>
        <li>Access vendor and staffing services</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This invitation will expire in 30 days. If you have any questions, feel free to reach out to ${inviterName}.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        You received this email because ${inviterName} invited you to join PingJob. 
        If you don't want to receive these emails, you can ignore this invitation.
      </p>
    </div>
  `;
  
  const textContent = `
    You're invited to join PingJob!
    
    Hi ${recipientName},
    
    ${inviterName} has invited you to join PingJob, a professional networking platform for job seekers and industry professionals.
    
    ${message ? `Personal message: "${message}"` : ''}
    
    PingJob helps you:
    - Connect with industry professionals
    - Discover job opportunities from top companies
    - Build your professional network
    - Access vendor and staffing services
    
    Accept your invitation: ${inviteUrl}
    
    This invitation will expire in 30 days.
  `;
  
  try {
    return await sendEmail({
      to: recipientEmail,
      from: 'krupashankar@gmail.com', // Use verified sender identity
      subject,
      html: htmlContent,
      text: textContent
    });
  } catch (error) {
    // Log invitation details for manual sharing while email verification is pending
    console.log('\n=== INVITATION DETAILS FOR MANUAL SHARING ===');
    console.log(`To: ${recipientEmail}`);
    console.log(`From: ${inviterName}`);
    console.log(`Subject: ${subject}`);
    console.log(`Invitation Link: ${inviteUrl}`);
    console.log(`Custom Message: ${message || 'None'}`);
    console.log('==========================================\n');
    
    // Return false to indicate email delivery failed but invitation was saved
    return false;
  }
}