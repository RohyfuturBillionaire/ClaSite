const mongoose = require('mongoose');

const ImgArticleSchema = new mongoose.Schema({
  url_img: { type: String, required: true },
  id_article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ImgArticle', ImgArticleSchema);
