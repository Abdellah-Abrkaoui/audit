import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle, XCircle, FileImage } from 'lucide-react';

const CATEGORIES = ["Sport d'eau", "Sport de montagne"];

const AUDIT_TEMPLATE = {
    "Sport d'eau": {
        "Natation": {
            "Magasin Rapide / LDMC": ["Segmentation", "Propreté", "Balisage et Prix", "Facing de détail", "Rupture Visuelle", "Traitement des retours"],
            "Cabines": ["Propreté", "Affichage"]
        },
        "Surf": {
            "Magasin Rapide / LDMC": ["Segmentation", "Propreté", "Balisage et Prix", "Facing de détail", "Rupture Visuelle", "Traitement des retours"]
        },
        "Kayak": {
            "Magasin Rapide / LDMC": ["Segmentation", "Propreté", "Balisage et Prix", "Facing de détail", "Rupture Visuelle", "Traitement des retours"]
        }
    },
    "Sport de montagne": {
        "Rando Homme": {
            "Magasin Rapide / LDMC": ["Segmentation", "Propreté", "Balisage et Prix", "Facing de détail", "Rupture Visuelle", "Traitement des retours"]
        },
        "Rando Femme": {
            "Magasin Rapide / LDMC": ["Segmentation", "Propreté", "Balisage et Prix", "Facing de détail", "Rupture Visuelle", "Traitement des retours"]
        },
        "Rando JR": {
            "Magasin Rapide / LDMC": ["Segmentation", "Propreté", "Balisage et Prix", "Facing de détail", "Rupture Visuelle", "Traitement des retours"]
        }
    }
};

const generateInitialResponses = (cat) => {
    const responses = [];
    const templates = AUDIT_TEMPLATE[cat];
    for (let sub of Object.keys(templates)) {
        for (let sec of Object.keys(templates[sub])) {
            for (let label of templates[sub][sec]) {
                responses.push({
                    category: cat,
                    subcategory: sub,
                    section: sec,
                    label: label,
                    value: true,
                    photoUrl: null,
                    comment: ""
                });
            }
        }
    }
    return Object.values(
        responses.reduce((acc, obj) => {
            // Create a unique keyed object for React rendering ease, we'll strip key later
            acc[`${obj.subcategory}|${obj.section}|${obj.label}`] = obj;
            return acc;
        }, {})
    );
};

function AdminForm() {
    const navigate = useNavigate();
    const [site, setSite] = useState('');
    const [performedBy, setPerformedBy] = useState('');
    const [siteImage, setSiteImage] = useState(null);
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [responses, setResponses] = useState(generateInitialResponses(CATEGORIES[0]));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCategoryChange = (e) => {
        const newCat = e.target.value;
        if (window.confirm("Changing the category will reset your checklist. Continue?")) {
            setCategory(newCat);
            setResponses(Object.values(generateInitialResponses(newCat)));
        }
    };

    const updateResponse = (key, field, val) => {
        setResponses(prev => {
            const u = { ...prev };
            u[key][field] = val;
            return u;
        });
    };

    const handleFileUpload = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const res = await axios.post('https://audit-mbfr.onrender.com/api/audits/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.photoUrl;
        } catch (err) {
            console.error('Error uploading photo', err);
            alert('Failed to upload photo');
            return null;
        }
    };

    const handleSiteImageUpload = async (file) => {
        const url = await handleFileUpload(file);
        if (url) setSiteImage(url);
    };

    const handleItemPhotoUpload = async (key, file) => {
        const url = await handleFileUpload(file);
        if (url) updateResponse(key, 'photoUrl', url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                site,
                performedBy,
                siteImage,
                category,
                checklistResponses: Object.values(responses)
            };
            await axios.post('https://audit-mbfr.onrender.com/api/audits', payload);
            navigate('/');
        } catch (err) {
            console.error('Error submitting audit', err);
            alert('Failed to submit audit');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group responses for rendering
    const groupedResponses = Object.values(responses).reduce((acc, curr, idx) => {
        if (!acc[curr.subcategory]) acc[curr.subcategory] = {};
        if (!acc[curr.subcategory][curr.section]) acc[curr.subcategory][curr.section] = [];
        curr._idx = Object.keys(responses)[idx]; // safe binding
        acc[curr.subcategory][curr.section].push(curr);
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden max-w-5xl mx-auto border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-blue-600 shadow-sm" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">New Professional Audit</h2>
                    <p className="text-sm text-gray-500 mt-1">Capture detailed insights with photos and commentary</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Site Name</label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Decathlon City Center"
                            value={site}
                            onChange={e => setSite(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Auditor Name</label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. John Doe"
                            value={performedBy}
                            onChange={e => setPerformedBy(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Category</label>
                        <select
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                            value={category}
                            onChange={handleCategoryChange}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Main Site Photo (Optional)</label>
                        <div className="flex items-center space-x-4">
                            {siteImage ? (
                                <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                    <img src={`https://audit-mbfr.onrender.com${siteImage}`} className="h-16 w-32 object-cover" alt="Site" />
                                    <button type="button" onClick={() => setSiteImage(null)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                                </div>
                            ) : (
                                <label className="cursor-pointer flex items-center justify-center px-4 py-3 bg-white border border-gray-200 hover:border-blue-400 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors w-full">
                                    <FileImage className="w-5 h-5 mr-2" /> Upload Front Store Photo
                                    <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleSiteImageUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="bg-blue-600 w-2 h-6 rounded-full mr-3"></span>
                        Checklist Execution: {category}
                    </h3>

                    <div className="space-y-10">
                        {Object.keys(groupedResponses).map(sub => (
                            <div key={sub} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-gray-800 px-6 py-3 text-white font-bold text-lg">
                                    Subcategory: {sub}
                                </div>

                                <div className="p-6 space-y-8">
                                    {Object.keys(groupedResponses[sub]).map(sec => (
                                        <div key={sec} className="space-y-4">
                                            <h4 className="font-bold text-blue-900 text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                                                {sec}
                                            </h4>
                                            <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                                                {groupedResponses[sub][sec].map(item => (
                                                    <div key={item._idx} className={`p-5 rounded-xl border ${!item.value ? 'bg-red-50/50 border-red-100 shadow-sm shadow-red-100/50' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                            <div className="flex-1 font-semibold text-gray-800 text-[16px]">{item.label}</div>

                                                            {/* Controls */}
                                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                                                {/* Yes/No Toggles */}
                                                                <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateResponse(item._idx, 'value', true)}
                                                                        className={`px-5 py-2 rounded-md font-bold text-sm transition-all ${item.value ? 'bg-emerald-500 text-white shadow' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
                                                                    >
                                                                        OUI
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateResponse(item._idx, 'value', false)}
                                                                        className={`px-5 py-2 rounded-md font-bold text-sm transition-all ${!item.value ? 'bg-red-500 text-white shadow' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
                                                                    >
                                                                        NON
                                                                    </button>
                                                                </div>

                                                                {/* Comment */}
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add comment..."
                                                                    value={item.comment}
                                                                    onChange={(e) => updateResponse(item._idx, 'comment', e.target.value)}
                                                                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full md:w-48 outline-none"
                                                                />

                                                                {/* Photo */}
                                                                {item.photoUrl ? (
                                                                    <div className="relative group">
                                                                        <img src={`https://audit-mbfr.onrender.com${item.photoUrl}`} alt="proof" className="h-10 w-14 object-cover rounded-md border" />
                                                                        <button type="button" onClick={() => updateResponse(item._idx, 'photoUrl', null)} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow opacity-0 group-hover:opacity-100"><XCircle className="w-5 h-5" /></button>
                                                                    </div>
                                                                ) : (
                                                                    <label className="cursor-pointer text-gray-400 hover:text-blue-500 p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-200 shadow-sm transition-colors">
                                                                        <UploadCloud className="w-5 h-5" />
                                                                        <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleItemPhotoUpload(item._idx, e.target.files[0])} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center px-10 py-4 rounded-xl shadow-lg shadow-blue-500/30 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all hover:-translate-y-1"
                    >
                        {isSubmitting ? 'Saving Report...' : 'Finalize Audit Report'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AdminForm;