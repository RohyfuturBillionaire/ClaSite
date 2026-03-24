const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const CategorieArticle = require('../models/CategorieArticle');
const MouvementStock = require('../models/MouvementStock');
const ImgArticle = require('../models/ImgArticle');
const upload = require('../config/multer');
const { uploadFile, deleteFile } = require('../config/blob');

// ========== ARTICLES ==========

// Create article (multipart — images uploaded as files)
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const { nom, description, id_categorie_article, prix, id_boutique, stock, seuil_alerte } = req.body;

    const article = new Article({ nom, description, id_categorie_article, prix, id_boutique });
    await article.save();

    if (stock !== undefined) {
      await MouvementStock.create({
        id_article: article._id,
        quantity: Number(stock),
        type_mouvement: 1,
        seuil_alerte: Number(seuil_alerte) || 5
      });
    }

    // Upload images to Vercel Blob and save URLs
    if (req.files && req.files.length > 0) {
      const imgDocs = await Promise.all(req.files.map(async (f) => ({
        url_img: await uploadFile(f, 'articles'),
        id_article: article._id
      })));
      await ImgArticle.insertMany(imgDocs);
    }

    const populated = await Article.findById(article._id)
      .populate('id_categorie_article')
      .populate('id_boutique', 'nom');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/collection/:collectionId', async (req, res) => {
  try {
    const articles = await Article.find({ id_collection: req.params.collectionId, actif: true })
      .populate('id_categorie_article')
      .populate('id_boutique', 'nom')
      .sort({ createdAt: -1 });
    
      res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
      




// List articles (filter by boutique with ?boutique=ID)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.boutique) {
      filter.id_boutique = req.query.boutique;
    }

    const articles = await Article.find(filter)
      .populate('id_categorie_article')
      .populate('id_boutique', 'nom')
      .sort({ createdAt: -1 });

    // Enrich with stock and images
    const enriched = await Promise.all(articles.map(async (article) => {
      const art = article.toObject();

      // Get current stock from latest mouvement
      const mouvements = await MouvementStock.find({ id_article: art._id }).sort({ createdAt: -1 });
      let stock = 0;
      let seuil_alerte = 5;
      if (mouvements.length > 0) {
        seuil_alerte = mouvements[0].seuil_alerte || 5;
        for (const m of mouvements) {
          if (m.type_mouvement === 1) stock += m.quantity;
          else if (m.type_mouvement === 2) stock -= m.quantity;
        }
      }

      // Get images
      const images = await ImgArticle.find({ id_article: art._id });

      return {
        ...art,
        stock,
        seuil_alerte,
        images: images.map(i => i.url_img)
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single article
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('id_categorie_article')
      .populate('id_boutique', 'nom');

    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    const art = article.toObject();

    const mouvements = await MouvementStock.find({ id_article: art._id }).sort({ createdAt: -1 });
    let stock = 0;
    let seuil_alerte = 5;
    if (mouvements.length > 0) {
      seuil_alerte = mouvements[0].seuil_alerte || 5;
      for (const m of mouvements) {
        if (m.type_mouvement === 1) stock += m.quantity;
        else if (m.type_mouvement === 2) stock -= m.quantity;
      }
    }

    const images = await ImgArticle.find({ id_article: art._id });

    res.json({ ...art, stock, seuil_alerte, images: images.map(i => i.url_img) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update article (multipart — new images replace existing ones)
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { nom, description, id_categorie_article, prix, stock, seuil_alerte } = req.body;

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { nom, description, id_categorie_article, prix },
      { new: true, runValidators: true }
    );

    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    // Update stock if provided
    if (stock !== undefined) {
      const mouvements = await MouvementStock.find({ id_article: article._id });
      let currentStock = 0;
      for (const m of mouvements) {
        if (m.type_mouvement === 1) currentStock += m.quantity;
        else if (m.type_mouvement === 2) currentStock -= m.quantity;
      }

      const diff = Number(stock) - currentStock;
      if (diff !== 0) {
        await MouvementStock.create({
          id_article: article._id,
          quantity: Math.abs(diff),
          type_mouvement: diff > 0 ? 1 : 2,
          seuil_alerte: Number(seuil_alerte) || 5
        });
      } else if (seuil_alerte !== undefined) {
        const latest = await MouvementStock.findOne({ id_article: article._id }).sort({ createdAt: -1 });
        if (latest) {
          latest.seuil_alerte = Number(seuil_alerte);
          await latest.save();
        }
      }
    }

    // Replace images: delete old blobs then upload new ones
    if (req.files && req.files.length > 0) {
      const oldImgs = await ImgArticle.find({ id_article: article._id });
      await Promise.all(oldImgs.map(img => deleteFile(img.url_img)));
      await ImgArticle.deleteMany({ id_article: article._id });

      const imgDocs = await Promise.all(req.files.map(async (f) => ({
        url_img: await uploadFile(f, 'articles'),
        id_article: article._id
      })));
      await ImgArticle.insertMany(imgDocs);
    }

    const populated = await Article.findById(article._id)
      .populate('id_categorie_article')
      .populate('id_boutique', 'nom');

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle article actif/inactif
router.patch('/:id/toggle', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    article.actif = !article.actif;
    await article.save();

    res.json({ actif: article.actif });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete article (+ related stock movements and images)
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    // Delete images from Blob storage
    const imgs = await ImgArticle.find({ id_article: req.params.id });
    await Promise.all(imgs.map(img => deleteFile(img.url_img)));

    await MouvementStock.deleteMany({ id_article: req.params.id });
    await ImgArticle.deleteMany({ id_article: req.params.id });

    res.json({ message: 'Article supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== CATEGORIES ARTICLES ==========

// List categories for a boutique
router.get('/categories/boutique/:boutiqueId', async (req, res) => {
  try {
    const categories = await CategorieArticle.find({ id_boutique: req.params.boutiqueId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const cat = new CategorieArticle(req.body);
    await cat.save();
    res.status(201).json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const cat = await CategorieArticle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const cat = await CategorieArticle.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    await Article.updateMany({ id_categorie_article: req.params.id }, { $unset: { id_categorie_article: '' } });
    res.json({ message: 'Catégorie supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
