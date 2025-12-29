import nodemailer from 'nodemailer';

// درست انٹرفیس
export interface EmailOptions {
  to: string;
  name: string;
  course: string;
  applicationId: string;
  phone: string;
  referral?: string;
}

export async function sendAdmissionConfirmationEmail(options: EmailOptions) {
  // یہاں تبدیلی: createTransporter → createTransport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const referralText = options.referral
    ? `<strong>Referral Code:</strong> ${options.referral}<br>`
    : '';

  const mailOptions = {
    from: `"Quran & Islamic Academy" <${process.env.EMAIL_FROM || 'noreply@quranacademy.com'}>`,
    to: options.to,
    subject: 'Admission Application Received – Quran & Islamic Academy',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Application Received</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
          }
          /* باقی CSS وہی رہے گی... */
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0d9488 0%, #047857 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 20px; color: #0d9488; margin-bottom: 20px; }
          .info-box { background: #f0fdfa; border-left: 5px solid #0d9488; padding: 20px; border-radius: 8px; margin: 25px 0; font-size: 16px; }
          .info-box strong { color: #0d9488; }
          .list { padding-left: 20px; margin: 20px 0; }
          .list li { margin-bottom: 10px; }
          .footer { text-align: center; padding: 30px; background: #f9f9f9; color: #666; font-size: 14px; border-top: 1px solid #eee; }
          .highlight { color: #f59e0b; font-weight: bold; }
          a { color: #0d9488; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Quran & Islamic Academy</h1>
          </div>
          <div class="content">
            <p class="greeting">Assalamu Alaikum wa Rahmatullahi wa Barakatuh ${options.name},</p>
            
            <p>الحمدللہ! آپ کی ایڈمیشن کی درخواست کامیابی سے جمع ہو گئی ہے۔</p>
            <p>Thank you for choosing Quran & Islamic Academy. We have received your application successfully.</p>

            <div class="info-box">
              <strong>Application ID:</strong> ${options.applicationId}<br>
              <strong>Selected Course:</strong> ${options.course}<br>
              <strong>Contact Number:</strong> ${options.phone}<br>
              ${referralText}
              <strong>Status:</strong> <span class="highlight">Under Review</span>
            </div>

            <p>ان شاء اللہ ہماری ٹیم آپ کی درخواست کا جائزہ لے کر 2-3 کاروباری دنوں میں واٹس ایپ یا کال کے ذریعے رابطہ کرے گی۔</p>

            <p>آپ کو درج ذیل معلومات موصول ہوں گی:</p>
            <ul class="list">
              <li>انرولمنٹ کی تصدیق</li>
              <li>کلاس کا شیڈول اور ٹائمنگ</li>
              <li>استاد/استانی کی تفصیلات</li>
              <li>فیس کی ادائیگی کی ہدایات (اگر قابل اطلاق ہو)</li>
            </ul>

            <p>اگر آپ کا کوئی سوال ہو تو براہ مہربانی <a href="mailto:admissions@quranacademy.com">admissions@quranacademy.com</a> پر رابطہ کریں۔</p>

            <p><strong>نوٹ:</strong> اگر ہماری ای میلز نظر نہ آئیں تو براہ مہربانی Spam/Junk فولڈر چیک کریں۔</p>

            <p style="margin-top: 30px;">
              جزاك الله خيراً<br>
              <strong>ایڈمیشن ٹیم</strong><br>
              Quran & Islamic Academy
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Quran & Islamic Academy. All rights reserved.</p>
            <p>This email was sent to: <strong>${options.to}</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully to:', options.to);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // ای میل فیل ہونے پر بھی ایڈمیشن بن جائے
  }
}