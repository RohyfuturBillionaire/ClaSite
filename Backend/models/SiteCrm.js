const mongoose = require('mongoose');

const SiteCrmSchema = new mongoose.Schema({
  nom_centre_commercial: { type: String, required: true },
  slogan: { type: String },
  email: { type: String },
  telephone: { type: String },
  adresse: { type: String },
  horaire_ouverture: { type: String },
  horaire_fermeture: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SiteCrm', SiteCrmSchema);
