const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Audit = require('../models/Audit');

// Set up multer for handling photo uploads securely
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Basic sanitize and unique id
        cb(null, `${Date.now()}-${file.originalname.replace(/\\s/g, '_')}`);
    }
});

const upload = multer({ storage });

// Extra Endpoint to upload single or multiple photos BEFORE submitting the test
// The frontend will call this as soon as user uploads an image to an item and attach the photoUrl into the main form data
router.post('/upload', upload.single('photo'), (req, res) => {
    if (req.file) {
        res.json({ photoUrl: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// Create fully populated Audit Document
router.post('/', async (req, res) => {
    try {
        const auditData = req.body;
        const newAudit = new Audit(auditData);
        const savedAudit = await newAudit.save();
        res.status(201).json(savedAudit);
    } catch (error) {
        console.error('Error creating audit:', error);
        res.status(500).json({ error: 'Failed to create audit', details: error.message });
    }
});

// Get all audits
router.get('/', async (req, res) => {
    try {
        const audits = await Audit.find().sort({ date: -1 });
        res.json(audits);
    } catch (error) {
        console.error('Error fetching audits:', error);
        res.status(500).json({ error: 'Failed to fetch audits' });
    }
});

// Get single audit by ID
router.get('/:id', async (req, res) => {
    try {
        const audit = await Audit.findById(req.params.id);
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        let totalItems = 0;
        let validItems = 0;
        let issuesCount = 0;
        const grouped = {};

        audit.checklistResponses.forEach(item => {
            totalItems++;
            if (item.value) validItems++;
            else issuesCount++;

            // category
            if (!grouped[item.category]) {
                grouped[item.category] = { total: 0, valid: 0, percentage: 0, subcategories: {} };
            }
            grouped[item.category].total++;
            if (item.value) grouped[item.category].valid++;

            // subcategory
            let subcats = grouped[item.category].subcategories;
            if (!subcats[item.subcategory]) {
                subcats[item.subcategory] = { total: 0, valid: 0, percentage: 0, sections: {} };
            }
            subcats[item.subcategory].total++;
            if (item.value) subcats[item.subcategory].valid++;

            // section
            let sections = subcats[item.subcategory].sections;
            if (!sections[item.section]) {
                sections[item.section] = { total: 0, valid: 0, percentage: 0, items: [] };
            }
            sections[item.section].total++;
            if (item.value) sections[item.section].valid++;
            sections[item.section].items.push(item);
        });

        // Calculate percentages
        const percentage = totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 0;

        for (let catKey in grouped) {
            let cat = grouped[catKey];
            cat.percentage = cat.total > 0 ? Math.round((cat.valid / cat.total) * 100) : 0;

            for (let subKey in cat.subcategories) {
                let sub = cat.subcategories[subKey];
                sub.percentage = sub.total > 0 ? Math.round((sub.valid / sub.total) * 100) : 0;

                for (let secKey in sub.sections) {
                    let sec = sub.sections[secKey];
                    sec.percentage = sec.total > 0 ? Math.round((sec.valid / sec.total) * 100) : 0;
                }
            }
        }

        res.json({
            audit,
            stats: { totalItems, validItems, issuesCount, percentage },
            grouped
        });
    } catch (error) {
        console.error('Error fetching audit:', error);
        res.status(500).json({ error: 'Failed to fetch audit' });
    }
});

// Delete an audit
router.delete('/:id', async (req, res) => {
    try {
        const audit = await Audit.findByIdAndDelete(req.params.id);
        if (!audit) return res.status(404).json({ error: 'Audit not found' });
        res.json({ message: 'Audit deleted successfully' });
    } catch (error) {
        console.error('Error deleting audit:', error);
        res.status(500).json({ error: 'Failed to delete audit' });
    }
});

module.exports = router;
