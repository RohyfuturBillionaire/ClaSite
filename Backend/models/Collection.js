const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
	collection_name: { type: String, required: true },
	debut_periode: { type: Date, required: true },
	fin_periode: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Collection', CollectionSchema);
