const mongoose = require('mongoose');

const CommandeSchema = new mongoose.Schema({
  articles: [{
    id_article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    quantite: { type: Number, required: true, default: 1 },
    prix: { type: Number, required: true }
  }],
  type_livraison: { type: String }, // livraison, retrait
  status: { type: String, default: 'en_attente' }, // en_attente, payee, expediee, livree, annulee
  id_client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  total: { type: Number, required: true },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
  date_commande: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Commande', CommandeSchema);
