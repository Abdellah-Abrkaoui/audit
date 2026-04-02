const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Audit = require('../models/Audit');
require('dotenv').config();
console.log("CLOUD NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API KEY:", process.env.CLOUDINARY_API_KEY);
console.log("API SECRET:", process.env.CLOUDINARY_API_SECRET);
// Configure Cloudinary using env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'auditDashboard',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
});

const upload = multer({ storage });

// Extra Endpoint to upload single or multiple photos BEFORE submitting the test
// The frontend will call this as soon as user uploads an image to an item and attach the photoUrl into the main form data
router.post('/upload', upload.single('photo'), (req, res) => {
    if (req.file) {
        res.json({ photoUrl: req.file.path });
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

        // Creating stats object
        const categoriesStats = [];

        audit.categories.forEach(cat => {
            let catTotal = 0;
            let catValid = 0;
            const subcategoriesStats = [];

            cat.subcategories.forEach(sub => {
                let subTotal = 0;
                let subValid = 0;

                sub.items.forEach(item => {
                    totalItems++;
                    catTotal++;
                    subTotal++;

                    if (item.value) {
                        validItems++;
                        catValid++;
                        subValid++;
                    } else {
                        issuesCount++;
                    }
                });

                subcategoriesStats.push({
                    name: sub.name,
                    percentage: subTotal > 0 ? Math.round((subValid / subTotal) * 100) : 0,
                    total: subTotal,
                    valid: subValid
                });
            });

            categoriesStats.push({
                name: cat.name,
                percentage: catTotal > 0 ? Math.round((catValid / catTotal) * 100) : 0,
                total: catTotal,
                valid: catValid,
                subcategories: subcategoriesStats
            });
        });

        const percentage = totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 0;

        res.json({
            audit,
            stats: { totalItems, validItems, issuesCount, percentage },
            categoriesStats
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
