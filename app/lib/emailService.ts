import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  name: string;
  course: string;
  applicationId: string;
}

export async function sendAdmissionConfirmationEmail(options: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: `"Quran & Islamic Academy" <${process.env.EMAIL_FROM || 'noreply@quranacademy.com'}>`,
    to: options.to,
    subject: 'Admission Application Received - Quran & Islamic Academy',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d9488 0%, #047857 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #0d9488; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Quran & Islamic Academy</h1>
          </div>
          <div class="content">
            <h2>Assalamu Alaikum ${options.name},</h2>
            <p>Thank you for submitting your admission application to Quran & Islamic Academy.</p>
            
            <div class="info-box">
              <strong>Application ID:</strong> ${options.applicationId}<br>
              <strong>Selected Course:</strong> ${options.course}<br>
              <strong>Status:</strong> <span style="color: #f59e0b;">Under Review</span>
            </div>
            
            <p>Our admissions team will review your application and contact you within 2-3 business days.</p>
            
            <p>You will receive:</p>
            <ul>
              <li>Confirmation of your enrollment</li>
              <li>Class schedule and timing details</li>
              <li>Teacher assignment information</li>
              <li>Payment instructions (if applicable)</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:admissions@quranacademy.com">admissions@quranacademy.com</a></p>
            
            <p><strong>Note:</strong> Please check your spam folder if you don't see our emails.</p>
            
            <p>JazakAllah Khair,<br>
            <strong>Admissions Team</strong><br>
            Quran & Islamic Academy</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Quran & Islamic Academy. All rights reserved.</p>
            <p>This email was sent to ${options.to}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
}