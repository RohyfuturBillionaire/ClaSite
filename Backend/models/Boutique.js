const mongoose = require('mongoose');

const BoutiqueSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  logo: { type: String },
  numero: { type: String },
  email: { type: String },
  reseaux: { type: String },
  horaire_ouvert: { type: String },
  user_proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  id_role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  id_categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie' },
  status: { type: Boolean, default: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Boutique', BoutiqueSchema);
