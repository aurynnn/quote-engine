// Email sending utility using MailerSend (already have API key)

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY || 'mlsn.cd2bf6bba836ee15a0b1aa4b8817ee75cc1d9f69677480989c96f131c45c56c0';
const FROM_EMAIL = 'info@dobble.tv';
const FROM_NAME = 'Quote Engine';

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

/**
 * Send email using MailerSend API
 */
export async function sendEmail({ to, toName, subject, html }: SendEmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`
      },
      body: JSON.stringify({
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        to: [
          {
            email: to,
            name: toName || to
          }
        ],
        subject,
        html
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('MailerSend error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Send quote to client
 */
export async function sendQuoteToClient(quote: any): Promise<boolean> {
  const subject = `Quote ${quote.quoteNumber} from Quote Engine`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #dc2626; }
        .quote-box { background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .quote-number { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .total { font-size: 28px; font-weight: bold; color: #dc2626; }
        .items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .items th { padding: 8px; text-align: left; background: #f3f4f6; font-size: 12px; }
        .items td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Quote Engine</div>
        </div>
        
        <p>Hello ${quote.clientName},</p>
        <p>Thank you for your interest! Please find your quote below.</p>
        
        <div class="quote-box">
          <div class="quote-number">Quote ${quote.quoteNumber}</div>
          <div class="total">€${quote.total.toFixed(2)}</div>
        </div>
        
        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>€${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="#" class="btn">View Full Quote</a>
        </p>
        
        <div class="footer">
          <p>© 2026 Quote Engine. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: quote.clientEmail,
    toName: quote.clientName,
    subject,
    html
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const subject = 'Welcome to Quote Engine!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #dc2626; text-align: center; margin-bottom: 30px; }
        .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Quote Engine</div>
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for signing up for Quote Engine.</p>
        <p>Get started by creating your first quote:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:4321/dashboard" class="btn">Go to Dashboard</a>
        </p>
        <p>If you have any questions, reply to this email.</p>
        <p>Best,<br>The Quote Engine Team</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({ to: email, toName: name, subject, html });
}
