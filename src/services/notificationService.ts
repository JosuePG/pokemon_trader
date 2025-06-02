import { Notification } from '../models/Notification';

export const notifyUser = async (userId: string, message: string, email: string) => {
  let emailSent = false;
  try {
    // simulate sending email
    console.log(`Sending email to ${email}: ${message}`);
    emailSent = true;
  } catch (err) {
    console.error(`Email sending failed to ${email}`);
  }
  await Notification.create({
    userId,
    message,
    emailAttempted: true,
    status: emailSent ? 'success' : 'failed',
  });
};