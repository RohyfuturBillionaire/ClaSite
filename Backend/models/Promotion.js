const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  titre: { type: String },
  contenue: { type: String },
  image: { type: String },
  date_debut: { type: Date, required: true },
  date_fin: { type: Date, required: true },
  remise: { type: Number }, // pourcentage de remise
  id_article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique' },
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', PromotionSchema);
