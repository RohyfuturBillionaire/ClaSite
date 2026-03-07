const Payment = require('../models/Payment');
const Contract = require('../models/Contract');

async function generateMonthlyPayments(mois, annee) {
  const contracts = await Contract.find({ statut: 'actif' })
    .populate('id_boutique');

  const results = { created: 0, skipped: 0, errors: [] };

  for (const contract of contracts) {
    // Ignorer les contrats sans boutique
    const boutiqueId = contract.id_boutique?._id || contract.id_boutique;
    if (!boutiqueId) {
      results.skipped++;
      continue;
    }

    // Verifier que le contrat couvre ce mois
    const dateEcheance = new Date(annee, mois - 1, 5);
    const debut = new Date(contract.date_debut);
    const fin = new Date(contract.date_fin);

    if (dateEcheance < debut || dateEcheance > fin) {
      results.skipped++;
      continue;
    }

    try {
      const existing = await Payment.findOne({ id_contract: contract._id, mois, annee });
      if (existing) {
        results.skipped++;
        continue;
      }

      const payment = new Payment({
        id_contract: contract._id,
        id_boutique: boutiqueId,
        mois,
        annee,
        montant: contract.loyer,
        date_echeance: dateEcheance,
        status: 'en_attente'
      });
      await payment.save();
      results.created++;
    } catch (error) {
      if (error.code === 11000) {
        results.skipped++;
      } else {
        results.errors.push({ contractId: contract._id, error: error.message });
      }
    }
  }

  return results;
}

async function generateCurrentMonthPayments() {
  const now = new Date();
  return generateMonthlyPayments(now.getMonth() + 1, now.getFullYear());
}

async function checkOverduePayments() {
  const now = new Date();
  const result = await Payment.updateMany(
    { status: 'en_attente', date_echeance: { $lt: now } },
    { status: 'en_retard' }
  );
  return { updated: result.modifiedCount };
}

module.exports = {
  generateMonthlyPayments,
  generateCurrentMonthPayments,
  checkOverduePayments
};
