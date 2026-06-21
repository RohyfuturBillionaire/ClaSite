const mongoose = require('mongoose');

const LivraisonSchema = new mongoose.Schema({
  lieu_livraison: { type: String, required: true },
  date_livraison: { type: Date },
  status: { type: String, default: 'en_preparation' }, // en_preparation, en_cours, livree, echouee
  id_client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Livraison', LivraisonSchema);
