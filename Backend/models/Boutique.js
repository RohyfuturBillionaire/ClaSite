const mongoose = require('mongoose');

const BoutiqueSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  logo: { type: String },
  email: { type: String },
  reseau: { type: String },
  horaire_ouvert: { type: String },
  user_proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  id_categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  local_boutique : { type: mongoose.Schema.Types.ObjectId, ref: 'Local' },
  loyer: { type: Number },
  type_boutique: { type: String },
  status: { type: Boolean, default: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Boutique', BoutiqueSchema);
