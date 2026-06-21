const express = require('express');
const router = express.Router();
const Boutique = require('../models/Boutique');
const Article = require('../models/Article');
const ImgArticle = require('../models/ImgArticle');
const upload = require('../config/multer');
const { uploadFile, deleteFile } = require('../config/blob');
const authenticateToken = require('../middleware/authMiddleware');
const requireBoutique = require('../middleware/requireBoutique');

// GET all boutiques
router.get('/', async (req, res) => {
  try {
    const { nom, categorie, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (nom) filter.nom = { $regex: nom, $options: 'i' };
    if (categorie) filter.id_categorie = categorie;
    if (status !== undefined) filter.status = status === 'true';

    const boutiques = await Boutique.find(filter)
      .populate('user_proprietaire', 'username email')
      .populate('id_categorie')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Boutique.countDocuments(filter);
    res.json({ data: boutiques, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// // GET boutiques without owner (not linked to any user)
// router.get('/unlinked', async (req, res) => {
//   try {
//     const boutiques = await Boutique.find({ 
//       $or: [
//         { user_proprietaire: null },
//         { user_proprietaire: { $exists: false } }
//       ],
//       status: true
//     })
//       .populate('id_categorie')
//       .sort({ createdAt: -1 });

//     res.json({ data: boutiques });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });



// GET my boutique (authenticated user's linked boutique - secured)
// router.get('/my-boutique', authenticateToken, requireBoutique, async (req, res) => {
//   try {
//     const boutique = await Boutique.findOne({
//       user_proprietaire: req.user.userId,
//       status: true
//     })
//       .populate('user_proprietaire', 'username email')
//       .populate('id_categorie');

//     if (!boutique) {
//       return res.status(404).json({ message: 'Aucune boutique associée à cet utilisateur' });
//     }

//     const boutiqueObj = boutique.toObject();

//     // Fetch articles for this boutique
//     const articles = await Article.find({ id_boutique: boutique._id, actif: true })
//       .populate('id_categorie_article');
//     const enrichedArticles = await Promise.all(articles.map(async (art) => {
//       const a = art.toObject();
//       const images = await ImgArticle.find({ id_article: a._id });
//       return { ...a, images: images.map(i => i.url_img) };
//     }));
//     boutiqueObj.articles = enrichedArticles;

//     res.json(boutiqueObj);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// GET single boutique (enriched with articles)
router.get('/:id', async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate('user_proprietaire', 'username email')
      .populate('id_categorie');
    if (!boutique) return res.status(404).json({ message: 'Boutique non trouvée' });

    const boutiqueObj = boutique.toObject();

    // Fetch articles for this boutique
    const articles = await Article.find({ id_boutique: boutique._id, actif: true })
      .populate('id_categorie_article');
    const enrichedArticles = await Promise.all(articles.map(async (art) => {
      const a = art.toObject();
      const images = await ImgArticle.find({ id_article: a._id });
      return { ...a, images: images.map(i => i.url_img) };
    }));
    boutiqueObj.articles = enrichedArticles;

    res.json(boutiqueObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const boutiques = await Boutique.findOne({ user_proprietaire: req.params.userId }) 
      .populate('user_proprietaire', 'nom prenom email')
      .populate('id_categorie')
    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } 
});

// POST create boutique
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.logo = await uploadFile(req.file, 'boutiques');
    }
    const boutique = new Boutique(data);
    await boutique.save();

    const populated = await Boutique.findById(boutique._id)
      .populate('user_proprietaire', 'nom prenom email')
      .populate('id_categorie')
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update boutique
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const data = { ...req.body };

    // Get current boutique to check if local is changing
    const currentBoutique = await Boutique.findById(req.params.id);
    if (!currentBoutique) return res.status(404).json({ message: 'Boutique non trouvée' });

    // Upload new logo and delete old one if a new file is provided
    if (req.file) {
      await deleteFile(currentBoutique.logo);
      data.logo = await uploadFile(req.file, 'boutiques');
    }

    const boutique = await Boutique.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('id_categorie')
      .populate('user_proprietaire', 'nom prenom username email')
      .populate('id_categorie');
    if (!boutique) return res.status(404).json({ message: 'Boutique non trouvée' });
    res.json(boutique);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT assign user to boutique
// router.put('/:id/assign-user', authenticateToken, async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const boutique = await Boutique.findByIdAndUpdate(
//       req.params.id,
//       { user_proprietaire: userId || null },
//       { new: true, runValidators: true }
//     )
//       .populate('user_proprietaire', 'username email')
//       .populate('id_categorie');

//     if (!boutique) return res.status(404).json({ message: 'Boutique non trouvée' });
//     res.json(boutique);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// DELETE boutique (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const boutique = await Boutique.findByIdAndUpdate(req.params.id, { status: false }, { new: true });
    if (!boutique) return res.status(404).json({ message: 'Boutique non trouvée' });
    res.json({ message: 'Boutique désactivée', boutique });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
