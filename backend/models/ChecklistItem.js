const mongoose = require('mongoose');
module.exports = mongoose.model('ChecklistItem', new mongoose.Schema({
    label: { type: String, required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' }
}, { timestamps: true }));
