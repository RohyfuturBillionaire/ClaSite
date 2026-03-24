const mongoose = require('mongoose');

const AvisClientBoutiqueSchema = new mongoose.Schema({
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
  note: { type: Number, required: true, min: 1, max: 5 },
  date_avis: { type: Date, default: Date.now }
}, { timestamps: true });

AvisClientBoutiqueSchema.index({ id_user: 1, id_boutique: 1 }, { unique: true });

module.exports = mongoose.model('AvisClientBoutique', AvisClientBoutiqueSchema);
