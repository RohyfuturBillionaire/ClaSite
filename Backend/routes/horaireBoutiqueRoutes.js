const express = require('express');
const router = express.Router();
const HoraireBoutique = require('../models/HoraireBoutique');
// Créer un horaire de boutique
router.post('/', async (req, res) => {
 try {
 const horaireBoutique = new HoraireBoutique(req.body);
 await horaireBoutique.save();
 res.status(201).json(horaireBoutique);
 } catch (error) {
 res.status(400).json({ message: error.message });
 }
});
var myLogger = function (req, res, next) {
  console.log(req.url);
  next();
}
router.use(myLogger);
// Lire tous les horaires de boutique
router.get('/', async (req, res) => {
 try {
 const horaires = await HoraireBoutique.find();
 res.json(horaires);
 } catch (error) {
 res.status(500).json({ message: error.message });
 }
});
router.get('/:boutiqueId', async (req, res) => {
    try {
        const horaires = await HoraireBoutique.find({ id_boutique: req.params.boutiqueId });
        res.json(horaires);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
 try {
 const horaireBoutique = await HoraireBoutique.findByIdAndUpdate(req.params.id,
req.body, { new: true });
 res.json(horaireBoutique);
 } catch (error) {
 res.status(400).json({ message: error.message });
 }
});
// Supprimer un horaire de boutique
router.delete('/:id', async (req, res) => {
 try {
 await HoraireBoutique.findByIdAndDelete(req.params.id);
 res.json({ message: "Horaire de boutique supprimé" });
 } catch (error) {
 res.status(500).json({ message: error.message });
 }
});

module.exports = router;