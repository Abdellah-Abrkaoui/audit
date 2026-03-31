import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle, XCircle, FileImage } from 'lucide-react';

function AdminForm() {
    const navigate = useNavigate();
    const [tree, setTree] = useState([]);
    const [categories, setCategories] = useState([]);

    const [site, setSite] = useState('');
    const [performedBy, setPerformedBy] = useState('');
    const [siteImage, setSiteImage] = useState(null);

    // New manual date input state
    const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);

    const [categoryObj, setCategoryObj] = useState(null);
    const [responses, setResponses] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadTree = async () => {
            try {
                const res = await axios.get('https://audit-mbfr.onrender.com/api/config/tree');
                setTree(res.data);
                if (res.data && res.data.length > 0) {
                    setCategories(res.data);
                }
            } catch (err) {
                console.error("Failed to load hierarchical template", err);
            }
        };
        loadTree();
    }, []);

    const handleCategoryChange = (e) => {
        const catId = e.target.value;
        if (!catId) {
            setCategoryObj(null);
            setResponses({});
            return;
        }

        if (Object.keys(responses).length > 0) {
            if (!window.confirm("Changing the category will reset your entire checklist. Continue?")) return;
        }

        const cat = tree.find(c => c._id === catId);
        setCategoryObj(cat);

        // Automatically traverse tree and create blank responses
        const initialResponses = {};
        cat.subcategories.forEach(sub => {
            sub.sections.forEach(sec => {
                sec.items.forEach(item => {
                    // Unique identifier for internal map
                    const key = item._id;
                    initialResponses[key] = {
                        categoryId: cat._id,
                        subcategoryId: sub._id,
                        sectionId: sec._id,
                        checklistItemId: item._id,
                        category: cat.name,
                        subcategory: sub.name,
                        section: sec.name,
                        label: item.label,
                        value: true,
                        photoUrl: null,
                        comment: ""
                    };
                });
            });
        });
        setResponses(initialResponses);
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
        if (!categoryObj || Object.keys(responses).length === 0) {
            alert("Please select a category that has configured checklist items before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                site,
                performedBy,
                date: auditDate,
                siteImage,
                category: categoryObj.name,
                categoryId: categoryObj._id,
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

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden max-w-5xl mx-auto border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-blue-600 shadow-sm" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">New Quality Audit</h2>
                    <p className="text-sm text-gray-500 mt-1">Structure defined dynamically from admin templates.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Site Name</label>
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
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Auditor Name</label>
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
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Audit Date</label>
                        <input
                            required
                            type="date"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                            value={auditDate}
                            onChange={e => setAuditDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Checklist Category Structure</label>
                        <select
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                            value={categoryObj ? categoryObj._id : ''}
                            onChange={handleCategoryChange}
                        >
                            <option value="">-- Select Template Category --</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Main Site Photo (Optional)</label>
                        <div className="flex items-center space-x-4">
                            {siteImage ? (
                                <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                    <img src={siteImage.startsWith('http') ? siteImage : `https://audit-mbfr.onrender.com${siteImage}`} className="h-20 w-40 object-cover" alt="Site" />
                                    <button type="button" onClick={() => setSiteImage(null)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm hover:bg-black/70">Remove</button>
                                </div>
                            ) : (
                                <label className="cursor-pointer flex items-center justify-center px-4 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors w-full md:w-1/2 h-20">
                                    <FileImage className="w-5 h-5 mr-2" /> Click to Upload Front Store Photo
                                    <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleSiteImageUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {categoryObj && (
                    <div className="pt-4 border-t-2 border-gray-100">
                        <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
                            <span className="bg-blue-600 w-2 h-7 rounded-full mr-3"></span>
                            Execution: {categoryObj.name}
                        </h3>

                        <div className="space-y-12">
                            {categoryObj.subcategories.map(sub => (
                                <div key={sub._id} className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="bg-gray-800 px-6 py-4 text-white font-black text-xl uppercase tracking-wider">
                                        {sub.name}
                                    </div>

                                    <div className="p-6 space-y-10">
                                        {sub.sections.map(sec => (
                                            <div key={sec._id} className="space-y-4">
                                                <h4 className="font-black text-blue-900 text-lg border-b-2 border-gray-100 pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
                                                    {sec.name}
                                                </h4>

                                                <div className="space-y-5 pl-2 border-l-4 border-gray-100 py-1">
                                                    {sec.items.map(item => {
                                                        const resData = responses[item._id];
                                                        if (!resData) return null; // Safe guard

                                                        return (
                                                            <div key={item._id} className={`p-5 rounded-2xl border transition-colors ${!resData.value ? 'bg-red-50/50 border-red-200 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                                    <div className="flex-1 font-bold text-gray-900 text-[16px] leading-tight">{item.label}</div>

                                                                    {/* Controls */}
                                                                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                                                                        {/* Yes/No Toggles */}
                                                                        <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateResponse(item._id, 'value', true)}
                                                                                className={`px-5 py-2.5 rounded-lg font-black text-sm transition-all ${resData.value ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                                                                            >
                                                                                OUI
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateResponse(item._id, 'value', false)}
                                                                                className={`px-5 py-2.5 rounded-lg font-black text-sm transition-all ${!resData.value ? 'bg-red-500 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                                                                            >
                                                                                NON
                                                                            </button>
                                                                        </div>

                                                                        <input
                                                                            type="text"
                                                                            placeholder="Optional notes or comments..."
                                                                            value={resData.comment}
                                                                            onChange={(e) => updateResponse(item._id, 'comment', e.target.value)}
                                                                            className="px-4 py-2.5 text-sm font-semibold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 w-full md:w-64 outline-none shadow-sm placeholder:font-normal"
                                                                        />

                                                                        {/* Photo */}
                                                                        {resData.photoUrl ? (
                                                                            <div className="relative group shrink-0">
                                                                                <img src={resData.photoUrl.startsWith('http') ? resData.photoUrl : `https://audit-mbfr.onrender.com${resData.photoUrl}`} alt="proof" className="h-12 w-16 object-cover rounded-lg border shadow-sm" />
                                                                                <button type="button" onClick={() => updateResponse(item._id, 'photoUrl', null)} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow-md opacity-0 group-hover:opacity-100 transform hover:scale-110 transition-all"><XCircle className="w-6 h-6" /></button>
                                                                            </div>
                                                                        ) : (
                                                                            <label className="shrink-0 cursor-pointer text-gray-500 hover:text-blue-600 p-2.5 bg-white rounded-xl border border-gray-300 hover:border-blue-400 shadow-sm transition-colors flex items-center justify-center">
                                                                                <UploadCloud className="w-5 h-5" />
                                                                                <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleItemPhotoUpload(item._id, e.target.files[0])} />
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {categoryObj.subcategories.length === 0 && (
                                <p className="text-gray-500 italic p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                    This category template is empty. Add subcategories, sections, and items from the Admin Panel.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="pt-8 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !categoryObj}
                        className="flex items-center px-12 py-4 rounded-xl shadow-lg shadow-blue-500/30 text-xl font-black text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all hover:-translate-y-1 cursor-pointer"
                    >
                        {isSubmitting ? 'Saving Report...' : 'Finalize & Store Audit'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AdminForm;