const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clasite';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connecté:', mongoose.connection.host);
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
