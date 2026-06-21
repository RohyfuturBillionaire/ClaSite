const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  contenue: { type: String, required: true },
  notification_message: { type: String },
  id_emetteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  id_recepteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date_envoie: { type: Date, default: Date.now },
  status: { type: String, default: 'non_lue' }, // non_lue, lue
  date_lecture: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
