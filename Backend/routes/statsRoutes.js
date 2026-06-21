const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Commande = require('../models/Commande');
const Article = require('../models/Article');
const User = require('../models/User');
const Collection = require('../models/Collection');
const MouvementStock = require('../models/MouvementStock');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

router.use(authenticateToken, authorize('stats'));

// Statuses that count as realized sales (revenue)
const PAID_STATUSES = ['payee', 'expediee', 'livree'];
const LOW_STOCK_DEFAULT = 5;

// GET /api/stats/overview — headline numbers for the dashboard
router.get('/overview', async (req, res) => {
  try {
    const [
      totalCommandes,
      byStatusAgg,
      revenueAgg,
      totalArticles,
      totalUsers,
      totalCollections,
      stockAgg
    ] = await Promise.all([
      Commande.countDocuments(),
      Commande.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Commande.aggregate([
        { $match: { status: { $in: PAID_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Article.countDocuments(),
      User.countDocuments(),
      Collection.countDocuments(),
      MouvementStock.aggregate([
        {
          $group: {
            _id: '$id_article',
            net: {
              $sum: {
                $cond: [{ $eq: ['$type_mouvement', 1] }, '$quantity', { $multiply: ['$quantity', -1] }]
              }
            }
          }
        }
      ])
    ]);

    const byStatus = {};
    byStatusAgg.forEach(s => { byStatus[s._id] = s.count; });

    const lowStock = stockAgg.filter(s => s.net <= LOW_STOCK_DEFAULT).length;

    res.json({
      commandes: { total: totalCommandes, byStatus },
      ventes: {
        chiffreAffaires: revenueAgg[0]?.total || 0,
        nbVentes: revenueAgg[0]?.count || 0
      },
      produits: { total: totalArticles, stockFaible: lowStock },
      collections: totalCollections,
      utilisateurs: totalUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/stats/sales-by-month?months=6 — revenue per month for a chart
router.get('/sales-by-month', async (req, res) => {
  try {
    const months = Math.min(Number(req.query.months) || 6, 24);
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const agg = await Commande.aggregate([
      { $match: { status: { $in: PAID_STATUSES }, date_commande: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: '$date_commande' }, m: { $month: '$date_commande' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);

    const map = {};
    agg.forEach(a => { map[`${a._id.y}-${a._id.m}`] = a; });

    const series = [];
    const cur = new Date(start);
    for (let i = 0; i < months; i++) {
      const key = `${cur.getFullYear()}-${cur.getMonth() + 1}`;
      const hit = map[key];
      series.push({
        annee: cur.getFullYear(),
        mois: cur.getMonth() + 1,
        total: hit?.total || 0,
        count: hit?.count || 0
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    res.json(series);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/stats/recent-commandes?limit=5 — quick access
router.get('/recent-commandes', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 50);
    const commandes = await Commande.find()
      .populate('id_client', 'username')
      .sort({ date_commande: -1, createdAt: -1 })
      .limit(limit);
    res.json(commandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/stats/low-stock — articles at/under their alert threshold
router.get('/low-stock', async (req, res) => {
  try {
    const articles = await Article.find().populate('id_categorie_article', 'categorie_article');
    const result = [];
    for (const art of articles) {
      const mouvements = await MouvementStock.find({ id_article: art._id }).sort({ createdAt: -1 });
      let stock = 0;
      let seuil = LOW_STOCK_DEFAULT;
      if (mouvements.length) {
        seuil = mouvements[0].seuil_alerte || LOW_STOCK_DEFAULT;
        for (const m of mouvements) stock += m.type_mouvement === 1 ? m.quantity : -m.quantity;
      }
      if (stock <= seuil) {
        result.push({ _id: art._id, nom: art.nom, stock, seuil_alerte: seuil });
      }
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
