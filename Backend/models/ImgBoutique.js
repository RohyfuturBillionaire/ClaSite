const mongoose = require('mongoose');

const ImgBoutiqueSchema = new mongoose.Schema({
	img_url: { type: String, required: true },
	date_upload: { type: Date, default: Date.now },
	id_boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ImgBoutique', ImgBoutiqueSchema);
