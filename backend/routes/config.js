const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Section = require('../models/Section');
const ChecklistItem = require('../models/ChecklistItem');

// Default standard criteria for convenience
const DEFAULT_CRITERIA = [
    "Facing de détail",
    "Balisage et prix buste",
    "Rupture visuelle",
    "Propreté (articles + agencement)",
    "Traitement des retours",
    "Barre de segmentation",
    "Allée propre et dégagée",
    "5 à 8 cabas",
    "Verticalisation",
    "Banque d’essayage (chaussures)",
    "Balisage aligné",
    "Bonne implantation"
];

// --- Categories CRUD ---
router.get('/categories', async (req, res) => {
    try {
        const data = await Category.find().sort({ createdAt: 1 });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/categories', async (req, res) => {
    try {
        const { name, initialRayons, withDefaultCriteria } = req.body;
        const saved = await new Category({ name }).save();

        if (initialRayons && Array.isArray(initialRayons) && initialRayons.length > 0) {
            for (const rName of initialRayons) {
                const trimmed = typeof rName === 'string' ? rName.trim() : '';
                if (!trimmed) continue;
                const sub = await new Subcategory({ name: trimmed, categoryId: saved._id }).save();
                if (withDefaultCriteria) {
                    const itemsDocs = DEFAULT_CRITERIA.map(label => ({
                        label,
                        subcategoryId: sub._id
                    }));
                    await ChecklistItem.insertMany(itemsDocs);
                }
            }
        }

        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const updated = await Category.findByIdAndUpdate(
            req.params.id,
            { name: req.body.name },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Category not found' });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const subs = await Subcategory.find({ categoryId: req.params.id });
        const subIds = subs.map(s => s._id);

        await ChecklistItem.deleteMany({ subcategoryId: { $in: subIds } });
        await Section.deleteMany({ subcategoryId: { $in: subIds } });
        await Subcategory.deleteMany({ categoryId: req.params.id });
        await Category.findByIdAndDelete(req.params.id);

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Subcategories (Rayons) CRUD ---
router.get('/subcategories', async (req, res) => {
    try {
        const q = req.query.categoryId ? { categoryId: req.query.categoryId } : {};
        const data = await Subcategory.find(q).sort({ createdAt: 1 });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/subcategories', async (req, res) => {
    try {
        const { name, categoryId, withDefaultCriteria } = req.body;
        const saved = await new Subcategory({ name, categoryId }).save();

        // Optionally attach the 12 standard criteria immediately upon creation
        if (withDefaultCriteria) {
            const itemsDocs = DEFAULT_CRITERIA.map(label => ({
                label,
                subcategoryId: saved._id
            }));
            await ChecklistItem.insertMany(itemsDocs);
        }

        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/subcategories/:id', async (req, res) => {
    try {
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.categoryId) updateData.categoryId = req.body.categoryId;

        const updated = await Subcategory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Subcategory not found' });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/subcategories/:id', async (req, res) => {
    try {
        await ChecklistItem.deleteMany({ subcategoryId: req.params.id });
        await Section.deleteMany({ subcategoryId: req.params.id });
        await Subcategory.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Checklist Items (Critères) CRUD ---
router.get('/checklist-items', async (req, res) => {
    try {
        const q = {};
        if (req.query.subcategoryId) q.subcategoryId = req.query.subcategoryId;
        if (req.query.sectionId) q.sectionId = req.query.sectionId;
        const data = await ChecklistItem.find(q).sort({ createdAt: 1 });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/checklist-items', async (req, res) => {
    try {
        const saved = await new ChecklistItem(req.body).save();
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/checklist-items/:id', async (req, res) => {
    try {
        const updated = await ChecklistItem.findByIdAndUpdate(
            req.params.id,
            { label: req.body.label },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Item not found' });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/checklist-items/:id', async (req, res) => {
    try {
        await ChecklistItem.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Master Template Loader ---
// Fetches the entire tree structure (Categories -> Subcategories/Rayons -> Items)
router.get('/tree', async (req, res) => {
    try {
        const [cats, subs, secs, items] = await Promise.all([
            Category.find().sort({ createdAt: 1 }),
            Subcategory.find().sort({ createdAt: 1 }),
            Section.find().sort({ createdAt: 1 }),
            ChecklistItem.find().sort({ createdAt: 1 })
        ]);

        const tree = cats.map(cat => {
            const catSubs = subs.filter(s => s.categoryId && s.categoryId.toString() === cat._id.toString());
            return {
                ...cat.toObject(),
                subcategories: catSubs.map(sub => {
                    // Gather items linked directly to this subcategory OR via its sections
                    const directItems = items.filter(i => i.subcategoryId && i.subcategoryId.toString() === sub._id.toString());
                    const subSecs = secs.filter(sec => sec.subcategoryId && sec.subcategoryId.toString() === sub._id.toString());
                    const secItemIds = new Set();
                    subSecs.forEach(sec => {
                        items.filter(i => i.sectionId && i.sectionId.toString() === sec._id.toString())
                             .forEach(i => secItemIds.add(i));
                    });

                    // Combined items list
                    const allItems = [...directItems, ...Array.from(secItemIds)];

                    return {
                        ...sub.toObject(),
                        sections: subSecs,
                        items: allItems
                    };
                })
            };
        });

        res.json(tree);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Seed Default Structure (Randonnée & Sport d'eau) ---
router.post('/seed-default', async (req, res) => {
    try {
        // Optional: clear existing config if requested
        if (req.body.reset) {
            await Promise.all([
                Category.deleteMany({}),
                Subcategory.deleteMany({}),
                Section.deleteMany({}),
                ChecklistItem.deleteMany({})
            ]);
        }

        const template = [
            {
                name: "Randonnée",
                subcategories: ["Homme", "Femme", "JR", "Showroom"]
            },
            {
                name: "Sport d'eau",
                subcategories: ["Natation / Lunette", "JR / Bébé", "Surf"]
            }
        ];

        for (const catData of template) {
            let cat = await Category.findOne({ name: catData.name });
            if (!cat) {
                cat = await new Category({ name: catData.name }).save();
            }

            for (const subName of catData.subcategories) {
                let sub = await Subcategory.findOne({ name: subName, categoryId: cat._id });
                if (!sub) {
                    sub = await new Subcategory({ name: subName, categoryId: cat._id }).save();
                }

                // Check existing items
                const existingItems = await ChecklistItem.find({ subcategoryId: sub._id });
                if (existingItems.length === 0) {
                    const docs = DEFAULT_CRITERIA.map(label => ({
                        label,
                        subcategoryId: sub._id
                    }));
                    await ChecklistItem.insertMany(docs);
                }
            }
        }

        res.json({ success: true, message: "Default structure seeded successfully!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
