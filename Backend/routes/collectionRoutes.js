const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
router.get('/', (req, res) => {
    Collection.find()
        .then(collections => {
            res.json(collections);
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});

router.get('/:id', (req, res) => {
    Collection.findById(req.params.id)
        .then(collection => {
            if (!collection) {
                return res.status(404).json({ message: 'Collection not found' });
            }
            res.json(collection);
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});
router.post('/', (req, res) => {
    const { collection_name, debut_periode, fin_periode } = req.body;
    const newCollection = new Collection({
        collection_name,
        debut_periode,
        fin_periode
    });
    newCollection.save()
        .then(collection => {
            res.status(201).json(collection);
        })
        .catch(err => {
            res.status(400).json({ error: err.message });
        });
});
router.put('/:id', (req, res) => {
    const { collection_name, debut_periode, fin_periode } = req.body;
    Collection.findByIdAndUpdate(req.params.id, {
        collection_name,
        debut_periode,
        fin_periode
    }, { new: true })
        .then(collection => {
            if (!collection) {
                return res.status(404).json({ message: 'Collection not found' });
            }
            res.json(collection);
        })
        .catch(err => {
            res.status(400).json({ error: err.message });
        });
});
router.delete('/:id', (req, res) => {
    Collection.findByIdAndDelete(req.params.id)
        .then(collection => {
            if (!collection) {
                return res.status(404).json({ message: 'Collection not found' });
            }
            res.json({ message: 'Collection deleted' });
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        }
    );
});


module.exports = router;