const PDFDocument = require('pdfkit');
const { MONTHS_FR } = require('./emailTemplates');

function formatMontant(montant) {
  return (montant || 0).toLocaleString('fr-FR');
}

function generateInvoicePDF(payment, boutique, contract, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Header ---
      doc.rect(0, 0, doc.page.width, 100).fill('#1a1a2e');
      doc.fillColor('#C9A962').fontSize(24).font('Helvetica-Bold')
        .text('TANA CENTER', 50, 25, { align: 'center' });
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica')
        .text('FACTURE', 50, 60, { align: 'center' });

      let y = 120;

      // --- Facture info ---
      doc.fillColor('#C9A962').fontSize(14).font('Helvetica-Bold')
        .text(payment.facture_numero, 50, y);
      doc.fillColor('#999').fontSize(10).font('Helvetica')
        .text(`Date d'emission : ${new Date().toLocaleDateString('fr-FR')}`, 350, y);
      y += 30;

      // --- Separator ---
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#C9A962').lineWidth(2).stroke();
      y += 20;

      // --- Emetteur / Destinataire ---
      doc.fillColor('#1a1a2e').fontSize(10).font('Helvetica-Bold').text('EMETTEUR', 50, y);
      doc.font('Helvetica-Bold').text('DESTINATAIRE', 320, y);
      y += 15;
      doc.font('Helvetica').fillColor('#333');
      doc.text('TANA CENTER SARL', 50, y);
      doc.text(boutique?.nom || contract?.nom_entreprise || '—', 320, y);
      y += 13;
      doc.text('Avenue de l\'Independance', 50, y);
      doc.text(user?.username || contract?.nom_client || '—', 320, y);
      y += 13;
      doc.text('Antananarivo 101, Madagascar', 50, y);
      doc.text(user?.email || boutique?.email || '—', 320, y);
      y += 13;
      doc.text('contact@tanacenter.mg', 50, y);
      y += 30;

      // --- Separator ---
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#eee').lineWidth(1).stroke();
      y += 20;

      // --- Table header ---
      const tableX = 50;
      const cols = [200, 120, 120, 100];
      doc.rect(tableX, y, 495, 28).fill('#f8f9fc');
      doc.fillColor('#666').fontSize(9).font('Helvetica-Bold');
      doc.text('DESIGNATION', tableX + 10, y + 9);
      doc.text('PERIODE', tableX + cols[0] + 10, y + 9);
      doc.text('ECHEANCE', tableX + cols[0] + cols[1] + 10, y + 9);
      doc.text('MONTANT', tableX + cols[0] + cols[1] + cols[2] + 10, y + 9);
      y += 28;

      // --- Table row ---
      doc.fillColor('#333').fontSize(10).font('Helvetica');
      doc.text('Loyer mensuel', tableX + 10, y + 8);
      doc.text(`${MONTHS_FR[payment.mois]} ${payment.annee}`, tableX + cols[0] + 10, y + 8);
      doc.text(new Date(payment.date_echeance).toLocaleDateString('fr-FR'), tableX + cols[0] + cols[1] + 10, y + 8);
      doc.font('Helvetica-Bold').fillColor('#C9A962')
        .text(`${formatMontant(payment.montant)} Ar`, tableX + cols[0] + cols[1] + cols[2] + 10, y + 8);
      y += 30;

      // --- Separator ---
      doc.moveTo(tableX, y).lineTo(545, y).strokeColor('#eee').lineWidth(1).stroke();
      y += 15;

      // --- TVA & Total ---
      const tva = Math.round(payment.montant * 0.2);
      const totalTTC = payment.montant + tva;

      doc.fillColor('#333').fontSize(10).font('Helvetica');
      doc.text('Sous-total HT', 350, y);
      doc.text(`${formatMontant(payment.montant)} Ar`, 460, y);
      y += 18;
      doc.text('TVA (20%)', 350, y);
      doc.text(`${formatMontant(tva)} Ar`, 460, y);
      y += 20;

      doc.rect(350, y, 195, 35).fill('#1a1a2e');
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text('TOTAL TTC', 365, y + 10);
      doc.fillColor('#C9A962').fontSize(13)
        .text(`${formatMontant(totalTTC)} Ar`, 440, y + 9);
      y += 55;

      // --- Payment info ---
      if (payment.status === 'paye' && payment.date_paiement) {
        doc.fillColor('#4CAF50').fontSize(11).font('Helvetica-Bold')
          .text('PAYE', 50, y);
        doc.fillColor('#333').fontSize(10).font('Helvetica')
          .text(`Date de paiement : ${new Date(payment.date_paiement).toLocaleDateString('fr-FR')}`, 50, y + 15);
        y += 40;
      }

      // --- Notes ---
      if (payment.notes) {
        doc.fillColor('#666').fontSize(9).font('Helvetica')
          .text(`Notes : ${payment.notes}`, 50, y, { width: 495 });
        y += 25;
      }

      // --- Footer ---
      const pageHeight = doc.page.height;
      doc.moveTo(50, pageHeight - 60).lineTo(545, pageHeight - 60).strokeColor('#eee').lineWidth(1).stroke();
      doc.fillColor('#999').fontSize(8).font('Helvetica')
        .text('TANA CENTER SARL — Capital 500.000.000 Ar — NIF: 12345678', 50, pageHeight - 50, { align: 'center', width: 495 });
      doc.text(`Document genere le ${new Date().toLocaleDateString('fr-FR')}`, 50, pageHeight - 38, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePDF };
