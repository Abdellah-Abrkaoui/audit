const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    value: { type: Boolean, required: true },
    photoUrl: { type: String, default: null },
    comment: { type: String, default: null }
}, { _id: false });

const subcategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    items: [checklistItemSchema]
}, { _id: false });

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    subcategories: [subcategorySchema]
}, { _id: false });

const auditSchema = new mongoose.Schema({
    site: { type: String, required: true },
    performedBy: { type: String, required: true, default: "Admin" },
    siteImage: { type: String, default: null },
    date: { type: Date, default: Date.now },
    categories: [categorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Audit', auditSchema);
