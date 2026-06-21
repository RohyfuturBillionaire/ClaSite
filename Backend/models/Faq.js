const mongoose = require('mongoose');

const FaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  reponse: { type: String, required: true },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique' },
  id_categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'FaqCategorie' },
  ordre: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Faq', FaqSchema);
