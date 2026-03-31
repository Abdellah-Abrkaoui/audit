const mongoose = require('mongoose');
module.exports = mongoose.model('Section', new mongoose.Schema({
    name: { type: String, required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', required: true }
}, { timestamps: true }));
