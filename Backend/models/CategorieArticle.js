const mongoose = require('mongoose');

const CategorieArticleSchema = new mongoose.Schema({
  categorie_article: { type: String, required: true },
  id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true }
}, { timestamps: true });

module.exports = mongoose.model('CategorieArticle', CategorieArticleSchema);
