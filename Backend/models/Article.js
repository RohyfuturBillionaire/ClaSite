const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  id_categorie_article: { type: mongoose.Schema.Types.ObjectId, ref: 'CategorieArticle' },
  prix: { type: Number, required: true },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
  id_collection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Article', ArticleSchema);
