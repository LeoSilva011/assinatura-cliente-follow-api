// src/controllers/emailSender.js
const nodemailer = require('nodemailer');

// Configure o transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Substitua pelo seu provedor de e-mail
  auth: {
    user: 'meganekddu@gmail.com', // Substitua pelo seu endereço de e-mail
    pass: 'cj221200'
  }
});


const sendEmail = async (to, subject, from, text, attachment) => {
  try {
    const info = await transporter.sendMail({
      from: `${from} <meganekddu@gmail.com>`,
      to,
      subject,
      text,
      attachments: [
        {
          filename: attachment.filename,
          content: attachment.content,
          encoding: attachment.encoding,
        }
      ]
    });

    console.log('E-mail enviado:', info);
    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};
