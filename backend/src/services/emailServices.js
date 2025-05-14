import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Sử dụng Gmail làm dịch vụ gửi email
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Chat_App" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject: "Your Verification Code",
    html: `<p>Your verification code is <strong>${code}</strong></p>`,
  });
};
