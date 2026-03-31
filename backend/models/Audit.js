const mongoose = require('mongoose');

const checklistResponseSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
    checklistItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChecklistItem', default: null },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    section: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Boolean, required: true },
    photoUrl: { type: String, default: null },
    comment: { type: String, default: null }
});

const auditSchema = new mongoose.Schema({
    site: { type: String, required: true },
    performedBy: { type: String, required: true, default: "Admin" },
    siteImage: { type: String, default: null },
    date: { type: Date, default: Date.now },
    category: { type: String },
    subcategory: { type: String },
    checklistResponses: [checklistResponseSchema]
}, { timestamps: true });

module.exports = mongoose.model('Audit', auditSchema);
