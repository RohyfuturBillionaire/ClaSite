const express = require('express');
const router = express.Router();
const Commande = require('../models/Commande');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const { generateCommandeInvoice } = require('../utils/commandeInvoice');

const STATUSES = ['en_attente', 'payee', 'expediee', 'livree', 'annulee'];

router.use(authenticateToken, authorize('commandes'));

function computeTotal(articles = []) {
  return articles.reduce((sum, l) => sum + (Number(l.prix) || 0) * (Number(l.quantite) || 0), 0);
}

// GET /api/commandes — list with ?status=&search=&from=&to=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { status, search, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.date_commande = {};
      if (from) filter.date_commande.$gte = new Date(from);
      if (to) filter.date_commande.$lte = new Date(to);
    }
    // Search by client username -> resolve to ids
    if (search) {
      const clients = await User.find({ username: { $regex: search, $options: 'i' } }).select('_id');
      filter.id_client = { $in: clients.map(c => c._id) };
    }

    const total = await Commande.countDocuments(filter);
    const commandes = await Commande.find(filter)
      .populate('id_client', 'username email')
      .populate('id_boutique', 'nom')
      .populate('articles.id_article', 'nom prix')
      .sort({ date_commande: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ data: commandes, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/commandes/:id — details
router.get('/:id', async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('id_client', 'username email')
      .populate('id_boutique', 'nom')
      .populate('articles.id_article', 'nom prix');
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/commandes — create (useful for testing / manual orders)
router.post('/', async (req, res) => {
  try {
    const { articles, type_livraison, status, id_client, id_boutique, date_commande } = req.body;
    if (!id_client || !articles || !articles.length) {
      return res.status(400).json({ message: 'id_client et au moins un article sont requis' });
    }
    const commande = await Commande.create({
      articles,
      type_livraison,
      status: status && STATUSES.includes(status) ? status : 'en_attente',
      id_client,
      id_boutique,
      total: req.body.total != null ? req.body.total : computeTotal(articles),
      date_commande: date_commande || Date.now()
    });
    const populated = await Commande.findById(commande._id)
      .populate('id_client', 'username email')
      .populate('articles.id_article', 'nom prix');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/commandes/:id/status — change status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: `Statut invalide. Valeurs: ${STATUSES.join(', ')}` });
    }
    const commande = await Commande.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('id_client', 'username email');
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(commande);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/commandes/:id/invoice — download PDF invoice
router.get('/:id/invoice', async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('id_client', 'username email')
      .populate('id_boutique', 'nom')
      .populate('articles.id_article', 'nom prix');
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });

    const pdf = await generateCommandeInvoice(commande);
    const ref = `CMD-${String(commande._id).slice(-8).toUpperCase()}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${ref}.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/commandes/:id
router.delete('/:id', async (req, res) => {
  try {
    const commande = await Commande.findByIdAndDelete(req.params.id);
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });
    res.json({ message: 'Commande supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
