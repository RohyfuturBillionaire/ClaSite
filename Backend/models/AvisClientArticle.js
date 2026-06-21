const mongoose = require('mongoose');

const AvisClientArticleSchema = new mongoose.Schema({
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id_article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  note: { type: Number, required: true, min: 1, max: 5 },
  date_avis: { type: Date, default: Date.now }
}, { timestamps: true });

AvisClientArticleSchema.index({ id_user: 1, id_article: 1 }, { unique: true });

module.exports = mongoose.model('AvisClientArticle', AvisClientArticleSchema);
