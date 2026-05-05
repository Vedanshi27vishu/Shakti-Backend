const nodemailer = require('nodemailer');
require('dotenv').config();

(async () => {
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : smtpPort === 465,
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  try {
    await transporter.verify();
    console.log('SMTP verified');

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test email from Shakti Backend',
      text: 'SMTP test'
    });
    console.log('Sent:', info.response);
  } catch (err) {
    console.error('Send error:', err);
    process.exitCode = 1;
  }
})();