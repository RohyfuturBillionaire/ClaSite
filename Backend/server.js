const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authenticateToken = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

// Serve uploaded files — local dev only (production uses Vercel Blob URLs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connexion à MongoDB
// mongoose.connect(process.env.MONGO_URI, {}).then(() => console.log("MongoDB connecté")).catch(err => console.log(err));


// Cron jobs
// const cron = require('node-cron');
// const { generateCurrentMonthPayments, checkOverduePayments } = require('./utils/paymentGenerator');

// Verification quotidienne des retards a minuit
// cron.schedule('0 0 * * *', async () => {
//   try {
//     const result = await checkOverduePayments();
//     console.log(`[CRON] Verification retards: ${result.updated} paiements mis a jour`);
//   } catch (error) {
//     console.error('[CRON] Erreur verification retards:', error.message);
//   }
// });

// Generation automatique le 1er de chaque mois a 1h du matin
// cron.schedule('0 1 1 * *', async () => {
//   try {
//     const result = await generateCurrentMonthPayments();
//     console.log(`[CRON] Generation mensuelle: ${result.created} crees, ${result.skipped} ignores`);
//   } catch (error) {
//     console.error('[CRON] Erreur generation mensuelle:', error.message);
//   }
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
