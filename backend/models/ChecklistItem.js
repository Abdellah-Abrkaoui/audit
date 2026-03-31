const mongoose = require('mongoose');
module.exports = mongoose.model('ChecklistItem', new mongoose.Schema({
    label: { type: String, required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true }
}, { timestamps: true }));
