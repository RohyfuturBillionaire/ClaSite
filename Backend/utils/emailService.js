const nodemailer = require('nodemailer');
const templates = require('./emailTemplates');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendPaymentConfirmation(payment, boutique, user) {
  const html = templates.getConfirmationEmailTemplate(payment, boutique, user);
  const to = user?.email || boutique?.email;
  if (!to) return { success: false, error: 'Aucune adresse email' };

  try {
    await transporter.sendMail({
      from: `"TANA CENTER" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Confirmation de paiement - ${templates.MONTHS_FR[payment.mois]} ${payment.annee}`,
      html
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendOverdueReminder(payment, boutique, user) {
  const html = templates.getOverdueEmailTemplate(payment, boutique, user);
  const to = user?.email || boutique?.email;
  if (!to) return { success: false, error: 'Aucune adresse email' };

  try {
    await transporter.sendMail({
      from: `"TANA CENTER" <${process.env.EMAIL_USER}>`,
      to,
      subject: `RAPPEL - Paiement en retard - ${templates.MONTHS_FR[payment.mois]} ${payment.annee}`,
      html
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendInvoiceByEmail(payment, boutique, user, pdfBuffer) {
  const html = templates.getInvoiceEmailTemplate(payment, boutique, user);
  const to = user?.email || boutique?.email;
  if (!to) return { success: false, error: 'Aucune adresse email' };

  try {
    await transporter.sendMail({
      from: `"TANA CENTER" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Facture ${payment.facture_numero} - TANA CENTER`,
      html,
      attachments: [{
        filename: `${payment.facture_numero}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPaymentConfirmation,
  sendOverdueReminder,
  sendInvoiceByEmail
};
