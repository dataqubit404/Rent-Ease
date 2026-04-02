const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"RentEase" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending failed to ${to}:`, error);
    throw error;
  }
};

const sendWelcomeEmail = async (user) => {
  return sendMail({
    to: user.email,
    subject: 'Welcome to RentEase! 🏠',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to RentEase</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.name}! 👋</h2>
          <p style="color: #666; line-height: 1.6;">
            Welcome to RentEase! Your account has been created successfully as a <strong>${user.role}</strong>.
          </p>
          <p style="color: #666;">Start exploring amazing properties and find your perfect rental.</p>
          <a href="${process.env.FRONTEND_URL}/properties" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
            Browse Properties
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2024 RentEase. All rights reserved.</p>
        </div>
      </div>
    `
  });
};

const sendBookingConfirmation = async (user, booking, property, rentDetails) => {
  return sendMail({
    to: user.email,
    subject: `Booking Request Submitted - ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Booking Request Submitted</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.name}!</h2>
          <p style="color: #666;">Your booking request for <strong>${property.title}</strong> has been submitted successfully.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin-top: 0;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">Check-in:</td><td style="padding: 8px 0; font-weight: bold;">${booking.start_date}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Check-out:</td><td style="padding: 8px 0; font-weight: bold;">${booking.end_date}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Nights:</td><td style="padding: 8px 0; font-weight: bold;">${rentDetails.totalNights}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Total Amount:</td><td style="padding: 8px 0; font-weight: bold; color: #667eea;">₹${rentDetails.totalAmount}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Status:</td><td style="padding: 8px 0;"><span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 12px; font-size: 12px;">PENDING</span></td></tr>
            </table>
          </div>
          <p style="color: #666;">The owner will confirm your booking shortly. You'll receive an email once confirmed.</p>
        </div>
      </div>
    `
  });
};

const sendPaymentReceipt = async (user, booking, payment) => {
  return sendMail({
    to: user.email,
    subject: `Payment Confirmed - Booking #${booking.id.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Payment Confirmed</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.name}!</h2>
          <p style="color: #666;">Your payment of <strong>₹${payment.amount}</strong> has been received and your booking is now confirmed!</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #666; margin: 0;">Transaction ID: <strong>${payment.transaction_id || payment.id}</strong></p>
          </div>
          <a href="${process.env.FRONTEND_URL}/dashboard/bookings" 
             style="display: inline-block; background: linear-gradient(135deg, #11998e, #38ef7d); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">
            View Booking
          </a>
        </div>
      </div>
    `
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  return sendMail({
    to: user.email,
    subject: 'Reset Your Password - RentEase',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #666;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
};

module.exports = { sendWelcomeEmail, sendBookingConfirmation, sendPaymentReceipt, sendPasswordResetEmail };
