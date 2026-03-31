const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Section = require('../models/Section');
const ChecklistItem = require('../models/ChecklistItem');

// --- Categories ---
router.get('/categories', async (req, res) => {
    try {
        const data = await Category.find();
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/categories', async (req, res) => {
    try {
        const saved = await new Category(req.body).save();
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/categories/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Subcategories ---
router.get('/subcategories', async (req, res) => {
    try {
        const q = req.query.categoryId ? { categoryId: req.query.categoryId } : {};
        const data = await Subcategory.find(q);
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/subcategories', async (req, res) => {
    try {
        const saved = await new Subcategory(req.body).save();
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/subcategories/:id', async (req, res) => {
    try {
        await Subcategory.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Sections ---
router.get('/sections', async (req, res) => {
    try {
        const q = req.query.subcategoryId ? { subcategoryId: req.query.subcategoryId } : {};
        const data = await Section.find(q);
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/sections', async (req, res) => {
    try {
        const saved = await new Section(req.body).save();
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/sections/:id', async (req, res) => {
    try {
        await Section.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Checklist Items ---
router.get('/checklist-items', async (req, res) => {
    try {
        const q = req.query.sectionId ? { sectionId: req.query.sectionId } : {};
        const data = await ChecklistItem.find(q);
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/checklist-items', async (req, res) => {
    try {
        const saved = await new ChecklistItem(req.body).save();
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/checklist-items/:id', async (req, res) => {
    try {
        await ChecklistItem.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Master Template Loader ---
// Fetches the entire tree structure dynamically for the frontend
router.get('/tree', async (req, res) => {
    try {
        // Deeply populate the tree is complicated in Mongoose visually, but we can just fetch all and stitch.
        const [cats, subs, secs, items] = await Promise.all([
            Category.find(), Subcategory.find(), Section.find(), ChecklistItem.find()
        ]);

        const tree = cats.map(cat => ({
            ...cat.toObject(),
            subcategories: subs.filter(s => s.categoryId.toString() === cat._id.toString()).map(sub => ({
                ...sub.toObject(),
                sections: secs.filter(sec => sec.subcategoryId.toString() === sub._id.toString()).map(sec => ({
                    ...sec.toObject(),
                    items: items.filter(i => i.sectionId.toString() === sec._id.toString())
                }))
            }))
        }));

        res.json(tree);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
