const PDFDocument = require('pdfkit');

function fmt(n) {
  return (Number(n) || 0).toLocaleString('fr-FR');
}

/**
 * Build an invoice PDF for a commande.
 * @param {object} commande - populated commande (articles.id_article, id_client, id_boutique)
 * @returns {Promise<Buffer>}
 */
function generateCommandeInvoice(commande) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', c => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.rect(0, 0, doc.page.width, 90).fill('#1a1a2e');
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
        .text('FACTURE', 50, 32);
      doc.fillColor('#C9A962').fontSize(12).font('Helvetica')
        .text(commande.id_boutique?.nom || 'CLA SITE', 50, 60);

      let y = 120;
      const ref = `CMD-${String(commande._id).slice(-8).toUpperCase()}`;
      doc.fillColor('#1a1a2e').fontSize(13).font('Helvetica-Bold').text(ref, 50, y);
      const dateCmd = commande.date_commande || commande.createdAt || new Date();
      doc.fillColor('#666').fontSize(10).font('Helvetica')
        .text(`Date : ${new Date(dateCmd).toLocaleDateString('fr-FR')}`, 400, y, { align: 'right' });
      y += 25;

      doc.moveTo(50, y).lineTo(545, y).strokeColor('#C9A962').lineWidth(2).stroke();
      y += 18;

      // Client
      const client = commande.id_client;
      doc.fillColor('#1a1a2e').fontSize(10).font('Helvetica-Bold').text('CLIENT', 50, y);
      y += 14;
      doc.font('Helvetica').fillColor('#333')
        .text(client?.username || 'Client', 50, y);
      if (client?.email) { y += 13; doc.text(client.email, 50, y); }
      y += 25;

      doc.fillColor('#333').fontSize(10).font('Helvetica')
        .text(`Type de livraison : ${commande.type_livraison || '—'}`, 50, y);
      y += 13;
      doc.text(`Statut : ${commande.status || '—'}`, 50, y);
      y += 25;

      // Table header
      const cols = { name: 50, qty: 330, price: 400, total: 480 };
      doc.fillColor('#1a1a2e').fontSize(10).font('Helvetica-Bold');
      doc.text('Article', cols.name, y);
      doc.text('Qté', cols.qty, y);
      doc.text('P.U.', cols.price, y);
      doc.text('Total', cols.total, y);
      y += 14;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#ddd').lineWidth(1).stroke();
      y += 8;

      // Rows
      let computedTotal = 0;
      doc.font('Helvetica').fillColor('#333').fontSize(10);
      for (const line of commande.articles || []) {
        const nom = line.id_article?.nom || 'Article';
        const qte = line.quantite || 0;
        const pu = line.prix || 0;
        const lineTotal = qte * pu;
        computedTotal += lineTotal;
        doc.text(nom, cols.name, y, { width: 270 });
        doc.text(String(qte), cols.qty, y);
        doc.text(fmt(pu), cols.price, y);
        doc.text(fmt(lineTotal), cols.total, y);
        y += 18;
      }

      y += 6;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#C9A962').lineWidth(2).stroke();
      y += 14;
      const total = commande.total != null ? commande.total : computedTotal;
      doc.fillColor('#1a1a2e').fontSize(13).font('Helvetica-Bold')
        .text(`TOTAL : ${fmt(total)} Ar`, 50, y, { align: 'right', width: 495 });

      doc.fillColor('#999').fontSize(9).font('Helvetica')
        .text('Merci pour votre commande.', 50, 770, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCommandeInvoice };
