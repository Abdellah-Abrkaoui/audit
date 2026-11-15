import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    UploadCloud, CheckCircle, XCircle, FileImage,
    Check, X, AlertTriangle, ArrowDown, Sparkles, Building2, User, Calendar
} from 'lucide-react';
import { API_BASE } from '../config';

const STANDARD_CRITERIA = [
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

const FIXED_AUDIT_STRUCTURE = [
    {
        name: "Randonnée",
        subcategories: [
            { name: "Homme" },
            { name: "Femme" },
            { name: "JR" },
            { name: "Showroom" }
        ].map(sub => ({
            ...sub,
            items: STANDARD_CRITERIA.map((label, idx) => ({
                id: `rando_${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx}`,
                label
            }))
        }))
    },
    {
        name: "Sport d'eau",
        subcategories: [
            { name: "Natation / Lunette" },
            { name: "JR / Bébé" },
            { name: "Surf" }
        ].map(sub => ({
            ...sub,
            items: STANDARD_CRITERIA.map((label, idx) => ({
                id: `eau_${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx}`,
                label
            }))
        }))
    }
];

function AdminForm() {
    const navigate = useNavigate();

    const [site, setSite] = useState('');
    const [performedBy, setPerformedBy] = useState('');
    const [siteImage, setSiteImage] = useState(null);
    const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);

    const [auditStructure, setAuditStructure] = useState(FIXED_AUDIT_STRUCTURE);
    const [isLoadingStructure, setIsLoadingStructure] = useState(true);
    const [responses, setResponses] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch fresh dynamic tree from the configuration DB
        const loadDynamicStructure = async () => {
            setIsLoadingStructure(true);
            try {
                const res = await axios.get(`${API_BASE}/api/config/tree`);
                if (res.data && res.data.length > 0) {
                    const formatted = res.data
                        .map(cat => ({
                            _id: cat._id,
                            name: cat.name,
                            subcategories: (cat.subcategories || [])
                                .filter(sub => sub.items && sub.items.length > 0)
                                .map(sub => ({
                                    _id: sub._id,
                                    name: sub.name,
                                    items: sub.items.map((item, idx) => ({
                                        id: `dyn_${sub._id || sub.name}_${item._id || idx}`,
                                        label: item.label
                                    }))
                                }))
                        }))
                        .filter(cat => cat.subcategories.length > 0);

                    if (formatted.length > 0) {
                        setAuditStructure(formatted);
                    }
                }
            } catch (err) {
                console.log('Using fixed fallback audit structure', err);
            } finally {
                setIsLoadingStructure(false);
            }
        };
        loadDynamicStructure();
    }, []);

    useEffect(() => {
        // Initialize responses structure whenever auditStructure updates
        const initialResponses = {};
        auditStructure.forEach((cat) => {
            cat.subcategories.forEach((sub) => {
                sub.items.forEach((item) => {
                    initialResponses[item.id] = {
                        categoryName: cat.name,
                        subcategoryName: sub.name,
                        label: item.label,
                        value: true,
                        photoUrl: null,
                        comment: ""
                    };
                });
            });
        });
        setResponses(initialResponses);
    }, [auditStructure]);

    const updateResponse = (key, field, val) => {
        setResponses(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: val }
        }));
    };

    // Quick mark all items in a subcategory as OUI
    const markAllRayon = (sub, value = true) => {
        setResponses(prev => {
            const next = { ...prev };
            sub.items.forEach(item => {
                if (next[item.id]) {
                    next[item.id] = { ...next[item.id], value };
                }
            });
            return next;
        });
    };

    const handleFileUpload = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const res = await axios.post(`${API_BASE}/api/audits/upload`, formData, {
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

    const buildCategories = () => {
        const categoriesMap = {};
        Object.values(responses).forEach(r => {
            if (!categoriesMap[r.categoryName]) {
                categoriesMap[r.categoryName] = { name: r.categoryName, subcategoriesMap: {} };
            }
            if (!categoriesMap[r.categoryName].subcategoriesMap[r.subcategoryName]) {
                categoriesMap[r.categoryName].subcategoriesMap[r.subcategoryName] = { name: r.subcategoryName, items: [] };
            }
            categoriesMap[r.categoryName].subcategoriesMap[r.subcategoryName].items.push({
                label: r.label,
                value: r.value,
                comment: r.comment || null,
                photoUrl: r.photoUrl || null
            });
        });

        return Object.values(categoriesMap).map(cat => ({
            name: cat.name,
            subcategories: Object.values(cat.subcategoriesMap).map(sub => ({
                name: sub.name,
                items: sub.items
            }))
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Object.keys(responses).length === 0) return;

        setIsSubmitting(true);
        try {
            const categories = buildCategories();

            const payload = {
                site,
                performedBy,
                date: auditDate,
                siteImage,
                categories
            };

            await axios.post(`${API_BASE}/api/audits`, payload);
            navigate('/');
        } catch (err) {
            console.error('Error submitting audit', err);
            alert('Failed to submit audit');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate live score stats
    const totalCount = Object.keys(responses).length;
    const validCount = Object.values(responses).filter(r => r.value).length;
    const issueCount = totalCount - validCount;
    const liveScore = totalCount > 0 ? Math.round((validCount / totalCount) * 100) : 100;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-24">
            {/* STICKY LIVE SCORE HEADER */}
            <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-gray-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border ${
                            liveScore >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : liveScore >= 60
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                    >
                        {liveScore}%
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Score en direct</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                            <span className="text-emerald-600 font-black">{validCount}</span> conformes •{' '}
                            <span className={issueCount > 0 ? 'text-rose-600 font-black' : 'text-gray-400 font-semibold'}>
                                {issueCount} anomalie{issueCount > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Department Jump Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {auditStructure.map((cat, idx) => (
                        <a
                            key={idx}
                            href={`#dept-${idx}`}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <span>{cat.name}</span>
                            <ArrowDown className="w-3 h-3 opacity-50" />
                        </a>
                    ))}
                </div>
            </div>

            {/* MAIN FORM CONTAINER */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                {/* Form Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-white flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
                        <CheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nouvel Audit de Linéaire</h2>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {auditStructure.length > 0 ? auditStructure.map(c => c.name).join(' • ') : "Chargement..."}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                    {/* General Information Card */}
                    <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-200/70 space-y-6">
                        <div className="flex items-center gap-2 pb-3 border-b border-gray-200/60">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-700">Informations Générales</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Nom du Site / Magasin <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-gray-800"
                                        placeholder="Ex: Decathlon Mohammedia"
                                        value={site}
                                        onChange={e => setSite(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Auditeur / Évaluateur <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-gray-800"
                                        placeholder="Ex: Nadia Handour"
                                        value={performedBy}
                                        onChange={e => setPerformedBy(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Date de l'Audit <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="date"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-gray-800 cursor-pointer"
                                    value={auditDate}
                                    onChange={e => setAuditDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Photo Façade / Rayon Principal (Optionnel)
                                </label>
                                <div className="flex items-center space-x-4">
                                    {siteImage ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                            <img
                                                src={siteImage.startsWith('http') ? siteImage : `${API_BASE}${siteImage}`}
                                                className="h-24 w-44 object-cover"
                                                alt="Site"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSiteImage(null)}
                                                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors w-full h-11">
                                            <FileImage className="w-4 h-4 mr-2" /> Joindre une photo de façade
                                            <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleSiteImageUpload(e.target.files[0])} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DEPARTMENTS & CHECKLIST SECTIONS */}
                    {isLoadingStructure ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-gray-500 font-bold text-sm">Chargement des départements et critères...</p>
                        </div>
                    ) : (
                        Object.keys(responses).length > 0 && auditStructure.map((categoryObj, cIdx) => (
                            <div
                                key={categoryObj._id || categoryObj.name}
                                id={`dept-${cIdx}`}
                                className="pt-6 border-t-2 border-gray-100 space-y-6 scroll-mt-36"
                            >
                                {/* Category Header */}
                                <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-950 text-white px-6 py-4 rounded-2xl shadow-sm">
                                    <h3 className="text-2xl font-black tracking-tight flex items-center">
                                        <span className="w-2.5 h-6 bg-blue-500 rounded-full mr-3"></span>
                                        {categoryObj.name}
                                    </h3>
                                    <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-blue-200">
                                        {categoryObj.subcategories.length} Rayons
                                    </span>
                                </div>

                                <div className="space-y-8">
                                    {categoryObj.subcategories.map(sub => (
                                        <div
                                            key={sub._id || sub.name}
                                            className="bg-white border-2 border-gray-200/80 rounded-2xl shadow-sm overflow-hidden"
                                        >
                                            {/* Subcategory Header */}
                                            <div className="bg-gray-100/90 border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-gray-900 text-base sm:text-lg">
                                                        {sub.name}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-0.5 rounded-md border border-gray-200">
                                                        {sub.items.length} points
                                                    </span>
                                                </div>

                                                {/* Quick action: Tout marquer OUI */}
                                                <button
                                                    type="button"
                                                    onClick={() => markAllRayon(sub, true)}
                                                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                                                    title="Valider tous les critères de ce rayon comme conformes"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Tout Conforme</span>
                                                </button>
                                            </div>

                                            {/* Checklist Items */}
                                            <div className="p-4 sm:p-6 space-y-3 divide-y divide-gray-100">
                                                {sub.items.map(item => {
                                                    const resData = responses[item.id];
                                                    if (!resData) return null;

                                                    const isPassed = resData.value;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`pt-3 first:pt-0 p-3 rounded-2xl border transition-all ${
                                                                !isPassed
                                                                    ? 'bg-red-50/70 border-red-200 shadow-sm'
                                                                    : 'bg-white border-transparent hover:border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                                {/* Label */}
                                                                <div className="flex items-start gap-2.5 flex-1">
                                                                    <span
                                                                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                                                            isPassed ? 'bg-emerald-500' : 'bg-red-500 ring-4 ring-red-200'
                                                                        }`}
                                                                    ></span>
                                                                    <div>
                                                                        <span
                                                                            className={`text-sm font-bold block ${
                                                                                isPassed ? 'text-gray-900' : 'text-red-950 font-black'
                                                                            }`}
                                                                        >
                                                                            {item.label}
                                                                        </span>
                                                                        {!isPassed && (
                                                                            <span className="text-xs font-bold text-red-600 inline-block mt-0.5">
                                                                                ⚠️ Non-conformité signalée
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Controls: OUI / NON toggles, Notes, Photo */}
                                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                                                    {/* Toggles */}
                                                                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateResponse(item.id, 'value', true)}
                                                                            className={`px-4 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                                                                                isPassed
                                                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                                                    : 'text-gray-500 hover:text-gray-900'
                                                                            }`}
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" /> OUI
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateResponse(item.id, 'value', false)}
                                                                            className={`px-4 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                                                                                !isPassed
                                                                                    ? 'bg-red-600 text-white shadow-sm'
                                                                                    : 'text-gray-500 hover:text-gray-900'
                                                                            }`}
                                                                        >
                                                                            <X className="w-3.5 h-3.5" /> NON
                                                                        </button>
                                                                    </div>

                                                                    {/* Notes / Comment */}
                                                                    <input
                                                                        type="text"
                                                                        placeholder={!isPassed ? "Motif de non-conformité..." : "Note optionnelle..."}
                                                                        value={resData.comment}
                                                                        onChange={(e) => updateResponse(item.id, 'comment', e.target.value)}
                                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl outline-none transition-all w-full sm:w-56 ${
                                                                            !isPassed
                                                                                ? 'bg-white border-2 border-red-300 text-red-900 placeholder:text-red-300 focus:border-red-500'
                                                                                : 'bg-white border border-gray-200 text-gray-700 focus:border-blue-500'
                                                                        }`}
                                                                    />

                                                                    {/* Photo upload proof */}
                                                                    {resData.photoUrl ? (
                                                                        <div className="relative group shrink-0">
                                                                            <img
                                                                                src={resData.photoUrl.startsWith('http') ? resData.photoUrl : `${API_BASE}${resData.photoUrl}`}
                                                                                alt="proof"
                                                                                className="h-10 w-14 object-cover rounded-lg border border-gray-300 shadow-sm"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateResponse(item.id, 'photoUrl', null)}
                                                                                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                                                                                title="Retirer la photo"
                                                                            >
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <label
                                                                            className={`shrink-0 cursor-pointer p-2 rounded-xl border transition-colors flex items-center justify-center h-10 w-12 ${
                                                                                !isPassed
                                                                                    ? 'bg-red-100/60 border-red-300 text-red-600 hover:bg-red-100'
                                                                                    : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300'
                                                                            }`}
                                                                            title="Prendre / joindre une photo de preuve"
                                                                        >
                                                                            <UploadCloud className="w-4 h-4" />
                                                                            <input
                                                                                type="file"
                                                                                className="sr-only"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleItemPhotoUpload(item.id, e.target.files[0])}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                    {/* SUBMIT BUTTON FOOTER */}
                    <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-gray-500">
                            Score final estimé: <strong className="text-gray-900 font-black">{liveScore}%</strong> ({validCount}/{totalCount} conformes)
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || Object.keys(responses).length === 0}
                            className="w-full sm:w-auto px-10 py-4 rounded-2xl shadow-xl shadow-blue-600/25 text-lg font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Enregistrement du rapport...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Valider et Enregistrer l'Audit</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminForm;
