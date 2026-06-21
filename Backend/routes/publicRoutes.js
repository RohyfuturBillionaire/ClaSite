const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const CategorieArticle = require('../models/CategorieArticle');
const Collection = require('../models/Collection');
const ImgArticle = require('../models/ImgArticle');
const MouvementStock = require('../models/MouvementStock');
const SiteCrm = require('../models/SiteCrm');
const SiteContenu = require('../models/SiteContenu');

/* ---------- helpers ---------- */

// Net stock for one article from its stock movements
async function stockOf(articleId) {
  const mvs = await MouvementStock.find({ id_article: articleId });
  let stock = 0;
  for (const m of mvs) stock += m.type_mouvement === 1 ? m.quantity : -m.quantity;
  return stock;
}

// Attach first image + stock to a plain article object
async function enrich(art) {
  const obj = art.toObject ? art.toObject() : art;
  const imgs = await ImgArticle.find({ id_article: obj._id });
  obj.images = imgs.map(i => i.url_img);
  obj.image = obj.images[0] || null;
  obj.stock = await stockOf(obj._id);
  return obj;
}

/* ---------- home ---------- */

// GET /api/public/home — hero + site config + featured (new arrivals) + collections
router.get('/home', async (req, res) => {
  try {
    const [crm, contenu, collections, nouveautes] = await Promise.all([
      SiteCrm.findOne(),
      SiteContenu.findOne(),
      Collection.find().sort({ debut_periode: -1 }).limit(6),
      Article.find({ actif: true }).sort({ createdAt: -1 }).limit(8).populate('id_categorie_article', 'categorie_article'),
    ]);
    const featured = await Promise.all(nouveautes.map(enrich));
    res.json({
      site: crm || { nom_centre_commercial: 'CLA SITE' },
      contenu: contenu || {},
      collections,
      nouveautes: featured,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- filters / categories ---------- */

// GET /api/public/filters — available filter options for the store
router.get('/filters', async (req, res) => {
  try {
    const [categories, genres, tailles, prixRange] = await Promise.all([
      CategorieArticle.find().select('categorie_article'),
      Article.distinct('genre', { actif: true }),
      Article.distinct('tailles', { actif: true }),
      Article.aggregate([
        { $match: { actif: true } },
        { $group: { _id: null, min: { $min: '$prix' }, max: { $max: '$prix' } } },
      ]),
    ]);
    res.json({
      categories,
      genres: genres.filter(Boolean),
      tailles: tailles.filter(Boolean).sort(),
      prix: { min: prixRange[0]?.min || 0, max: prixRange[0]?.max || 0 },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/public/categories — categories that have active products
router.get('/categories', async (req, res) => {
  try {
    const ids = await Article.distinct('id_categorie_article', { actif: true, id_categorie_article: { $ne: null } });
    const categories = await CategorieArticle.find({ _id: { $in: ids } }).select('categorie_article');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- products ---------- */

// GET /api/public/products — browse with filters/sort/pagination
//   ?search= &categorie=<id> &genre= &taille= &prix_min= &prix_max=
//   &collection=<id> &nouveaute=true &sort=recent|prix_asc|prix_desc &page= &limit=
router.get('/products', async (req, res) => {
  try {
    const { search, categorie, genre, taille, prix_min, prix_max, collection, sort, page = 1, limit = 12 } = req.query;
    const filter = { actif: true };

    if (search) filter.nom = { $regex: search, $options: 'i' };
    if (categorie) filter.id_categorie_article = categorie;
    if (genre) filter.genre = genre;
    if (taille) filter.tailles = taille;
    if (collection) filter.id_collection = collection;
    if (prix_min || prix_max) {
      filter.prix = {};
      if (prix_min) filter.prix.$gte = Number(prix_min);
      if (prix_max) filter.prix.$lte = Number(prix_max);
    }

    let sortBy = { createdAt: -1 };
    if (sort === 'prix_asc') sortBy = { prix: 1 };
    else if (sort === 'prix_desc') sortBy = { prix: -1 };

    const total = await Article.countDocuments(filter);
    const articles = await Article.find(filter)
      .populate('id_categorie_article', 'categorie_article')
      .populate('id_collection', 'collection_name')
      .sort(sortBy)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const data = await Promise.all(articles.map(enrich));
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/public/products/:id — detail + related products
router.get('/products/:id', async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, actif: true })
      .populate('id_categorie_article', 'categorie_article')
      .populate('id_collection', 'collection_name')
      .populate('id_boutique', 'nom');
    if (!article) return res.status(404).json({ message: 'Produit introuvable' });

    const detail = await enrich(article);

    const relatedDocs = await Article.find({
      _id: { $ne: article._id },
      actif: true,
      $or: [
        { id_categorie_article: article.id_categorie_article },
        { genre: article.genre },
      ],
    }).limit(4);
    detail.related = await Promise.all(relatedDocs.map(enrich));

    res.json(detail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- collections ---------- */

// GET /api/public/collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await Collection.find().sort({ debut_periode: -1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
