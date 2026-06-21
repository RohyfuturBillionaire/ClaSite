const mongoose = require('mongoose');

const PanierSchema = new mongoose.Schema({
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    id_article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    quantite: { type: Number, required: true, default: 1 },
    prix: { type: Number, required: true }
  }],
  total: { type: Number, default: 0 },
  status: { type: String, default: 'en_cours' } // en_cours, valide, abandonne
}, { timestamps: true });

module.exports = mongoose.model('Panier', PanierSchema);
