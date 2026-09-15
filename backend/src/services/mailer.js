import nodemailer from 'nodemailer';

export function isMailConfigured() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function fromAddress() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost';
}

export async function sendPasswordResetEmail({ to, resetLink }) {
  if (!isMailConfigured()) {
    throw new Error('SMTP is not configured');
  }
  const transport = getTransport();
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: 'Reset your password',
    text: [
      'You requested a password reset for your Museum & Planner account.',
      '',
      'Click the link below to set a new password:',
      resetLink,
      '',
      "If you didn't request this, you can ignore this email and your password will stay the same.",
      '',
      'This link expires in 1 hour.',
    ].join('\n'),
    html: `
      <p>You requested a password reset for your Museum &amp; Planner account.</p>
      <p><a href="${resetLink}">Set a new password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email and your password will stay the same.</p>
    `,
  });
}
