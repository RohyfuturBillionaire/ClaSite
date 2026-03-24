const mongoose = require('mongoose');

const HoraireBoutiqueSchema = new mongoose.Schema({
  horaire_ouverture: { type: String, required: true },
  horaire_fermeture: { type: String, required: true },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
  label: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('HoraireBoutique', HoraireBoutiqueSchema);