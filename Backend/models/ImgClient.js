const mongoose = require('mongoose');

const ImgClientSchema = new mongoose.Schema({
  url_image: { type: String, required: true },
  date_upload: { type: Date, default: Date.now },
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ImgClient', ImgClientSchema);
