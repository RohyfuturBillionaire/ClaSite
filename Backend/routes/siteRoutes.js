const express = require('express');
const router = express.Router();
const SiteContenu = require('../models/SiteContenu');
const SiteCrm = require('../models/SiteCrm');
const ImgClient = require('../models/ImgClient');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const upload = require('../config/multer');
const { uploadFile, deleteFile } = require('../config/blob');

router.use(authenticateToken, authorize('contenu'));

// ---------- Toggles (sections shown on the public site) ----------

// GET /api/site/contenu — returns the singleton (creates default if missing)
router.get('/contenu', async (req, res) => {
  try {
    let contenu = await SiteContenu.findOne();
    if (!contenu) contenu = await SiteContenu.create({});
    res.json(contenu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/site/contenu — update toggles
router.put('/contenu', async (req, res) => {
  try {
    const { SHOW_PROMOTION, SHOW_PLAN_CENTRE, SHOW_BOUTIQUES, SHOW_EVENEMENTS } = req.body;
    const updates = {};
    if (SHOW_PROMOTION !== undefined) updates.SHOW_PROMOTION = SHOW_PROMOTION;
    if (SHOW_PLAN_CENTRE !== undefined) updates.SHOW_PLAN_CENTRE = SHOW_PLAN_CENTRE;
    if (SHOW_BOUTIQUES !== undefined) updates.SHOW_BOUTIQUES = SHOW_BOUTIQUES;
    if (SHOW_EVENEMENTS !== undefined) updates.SHOW_EVENEMENTS = SHOW_EVENEMENTS;

    const contenu = await SiteContenu.findOneAndUpdate({}, updates, {
      new: true, upsert: true, setDefaultsOnInsert: true
    });
    res.json(contenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ---------- Texts (site / centre infos) ----------

// GET /api/site/crm
router.get('/crm', async (req, res) => {
  try {
    let crm = await SiteCrm.findOne();
    if (!crm) crm = await SiteCrm.create({ nom_centre_commercial: 'CLA SITE' });
    res.json(crm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/site/crm — update texts
router.put('/crm', async (req, res) => {
  try {
    const fields = ['nom_centre_commercial', 'slogan', 'email', 'telephone', 'adresse', 'horaire_ouverture', 'horaire_fermeture'];
    const updates = {};
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];

    const crm = await SiteCrm.findOneAndUpdate({}, updates, {
      new: true, upsert: true, setDefaultsOnInsert: true
    });
    res.json(crm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ---------- Images (home / banners) ----------

// GET /api/site/images
router.get('/images', async (req, res) => {
  try {
    const images = await ImgClient.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/site/images — upload one image (field name: "image")
router.post('/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' });
    const url = await uploadFile(req.file, 'site');
    const img = await ImgClient.create({ url_image: url });
    res.status(201).json(img);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/site/images/:id
router.delete('/images/:id', async (req, res) => {
  try {
    const img = await ImgClient.findByIdAndDelete(req.params.id);
    if (!img) return res.status(404).json({ message: 'Image introuvable' });
    await deleteFile(img.url_image);
    res.json({ message: 'Image supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
