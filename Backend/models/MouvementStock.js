const mongoose = require('mongoose');

const MouvementStockSchema = new mongoose.Schema({
  id_article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  quantity: { type: Number, required: true },
  type_mouvement: { type: Number, required: true }, // 1 = entrée, 2 = sortie
  date_mouvement: { type: Date, default: Date.now },
  seuil_alerte: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('MouvementStock', MouvementStockSchema);
