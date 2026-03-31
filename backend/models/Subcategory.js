const mongoose = require('mongoose');
module.exports = mongoose.model('Subcategory', new mongoose.Schema({
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
}, { timestamps: true }));
