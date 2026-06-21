const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
  id_role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  actif: { type: Boolean, default: true },
  article_souhait: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  boutique_favoris: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Boutique' }],
  achat: [{
    article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    prix: Number,
    quantite: Number,
    date_achat: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Hash password whenever it is set/changed.
// Async pre-hooks resolve via the returned promise (no `next` in modern Mongoose).
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plaintext candidate against the stored hash
UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
