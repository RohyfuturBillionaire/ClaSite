const MONTHS_FR = ['', 'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

function formatMontant(montant) {
  return (montant || 0).toLocaleString('fr-FR');
}

function getBaseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #1a1a2e; padding: 30px; text-align: center; }
    .header h1 { color: #C9A962; margin: 0; font-size: 28px; }
    .header p { color: #ffffff; margin: 5px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .footer { background: #f8f9fc; padding: 20px; text-align: center; font-size: 12px; color: #999; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .badge-success { background: #e8f5e9; color: #4CAF50; }
    .badge-danger { background: #ffebee; color: #EF5350; }
    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .table th, .table td { padding: 10px 15px; text-align: left; border-bottom: 1px solid #eee; }
    .table th { background: #f8f9fc; color: #666; font-size: 12px; text-transform: uppercase; }
    .amount { color: #C9A962; font-weight: 700; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TANA CENTER</h1>
      <p>Centre Commercial</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>TANA CENTER SARL — Avenue de l'Independance, Antananarivo 101</p>
      <p>Email: contact@tanacenter.mg | Tel: +261 20 22 000 00</p>
    </div>
  </div>
</body>
</html>`;
}

function getConfirmationEmailTemplate(payment, boutique, user) {
  const content = `
    <h2 style="color: #1a1a2e;">Confirmation de Paiement</h2>
    <p>Bonjour <strong>${user?.username || 'Cher locataire'}</strong>,</p>
    <p>Nous confirmons la reception de votre paiement pour la boutique <strong>${boutique?.nom || '—'}</strong>.</p>
    <table class="table">
      <tr><th>Facture N°</th><td>${payment.facture_numero}</td></tr>
      <tr><th>Periode</th><td>${MONTHS_FR[payment.mois]} ${payment.annee}</td></tr>
      <tr><th>Montant</th><td class="amount">${formatMontant(payment.montant)} Ar</td></tr>
      <tr><th>Date de paiement</th><td>${new Date(payment.date_paiement).toLocaleDateString('fr-FR')}</td></tr>
      <tr><th>Statut</th><td><span class="badge badge-success">Paye</span></td></tr>
    </table>
    <p>Merci pour votre confiance.</p>
    <p>Cordialement,<br><strong>L'equipe TANA CENTER</strong></p>`;
  return getBaseTemplate(content);
}

function getOverdueEmailTemplate(payment, boutique, user) {
  const content = `
    <h2 style="color: #EF5350;">Rappel de Paiement en Retard</h2>
    <p>Bonjour <strong>${user?.username || 'Cher locataire'}</strong>,</p>
    <p>Nous vous informons que le paiement suivant pour votre boutique <strong>${boutique?.nom || '—'}</strong> est en retard :</p>
    <table class="table">
      <tr><th>Facture N°</th><td>${payment.facture_numero}</td></tr>
      <tr><th>Periode</th><td>${MONTHS_FR[payment.mois]} ${payment.annee}</td></tr>
      <tr><th>Montant</th><td class="amount">${formatMontant(payment.montant)} Ar</td></tr>
      <tr><th>Date d'echeance</th><td style="color: #EF5350; font-weight: 600;">${new Date(payment.date_echeance).toLocaleDateString('fr-FR')}</td></tr>
      <tr><th>Statut</th><td><span class="badge badge-danger">En retard</span></td></tr>
    </table>
    <p>Nous vous prions de bien vouloir regulariser votre situation dans les meilleurs delais.</p>
    <p>Cordialement,<br><strong>L'equipe TANA CENTER</strong></p>`;
  return getBaseTemplate(content);
}

function getInvoiceEmailTemplate(payment, boutique, user) {
  const content = `
    <h2 style="color: #1a1a2e;">Votre Facture</h2>
    <p>Bonjour <strong>${user?.username || 'Cher locataire'}</strong>,</p>
    <p>Veuillez trouver ci-joint la facture pour votre boutique <strong>${boutique?.nom || '—'}</strong>.</p>
    <table class="table">
      <tr><th>Facture N°</th><td>${payment.facture_numero}</td></tr>
      <tr><th>Periode</th><td>${MONTHS_FR[payment.mois]} ${payment.annee}</td></tr>
      <tr><th>Montant</th><td class="amount">${formatMontant(payment.montant)} Ar</td></tr>
    </table>
    <p>La facture est disponible en piece jointe au format PDF.</p>
    <p>Cordialement,<br><strong>L'equipe TANA CENTER</strong></p>`;
  return getBaseTemplate(content);
}

module.exports = {
  MONTHS_FR,
  getConfirmationEmailTemplate,
  getOverdueEmailTemplate,
  getInvoiceEmailTemplate
};
