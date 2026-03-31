import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, Settings, FolderTree, FileText, CheckSquare, Layers } from 'lucide-react';

const API_BASE = 'https://audit-mbfr.onrender.com/api/config';

function ConfigPanel() {
    const [activeTab, setActiveTab] = useState('categories');

    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [sections, setSections] = useState([]);
    const [items, setItems] = useState([]);

    const [selectedCatId, setSelectedCatId] = useState('');
    const [selectedSubId, setSelectedSubId] = useState('');
    const [selectedSecId, setSelectedSecId] = useState('');

    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchCategories(); }, []);

    useEffect(() => {
        if (selectedCatId) fetchSubcategories(selectedCatId);
        else setSubcategories([]);
        setSelectedSubId('');
    }, [selectedCatId]);

    useEffect(() => {
        if (selectedSubId) fetchSections(selectedSubId);
        else setSections([]);
        setSelectedSecId('');
    }, [selectedSubId]);

    useEffect(() => {
        if (selectedSecId) fetchItems(selectedSecId);
        else setItems([]);
    }, [selectedSecId]);

    const fetchCategories = async () => {
        const res = await axios.get(`${API_BASE}/categories`);
        setCategories(res.data);
    };
    const fetchSubcategories = async (catId) => {
        const res = await axios.get(`${API_BASE}/subcategories?categoryId=${catId}`);
        setSubcategories(res.data);
    };
    const fetchSections = async (subId) => {
        const res = await axios.get(`${API_BASE}/sections?subcategoryId=${subId}`);
        setSections(res.data);
    };
    const fetchItems = async (secId) => {
        const res = await axios.get(`${API_BASE}/checklist-items?sectionId=${secId}`);
        setItems(res.data);
    };

    const handleAdd = async (e, type) => {
        e.preventDefault();
        if (!newItemName) return;
        setLoading(true);
        try {
            if (type === 'categories') {
                await axios.post(`${API_BASE}/categories`, { name: newItemName });
                fetchCategories();
            } else if (type === 'subcategories' && selectedCatId) {
                await axios.post(`${API_BASE}/subcategories`, { name: newItemName, categoryId: selectedCatId });
                fetchSubcategories(selectedCatId);
            } else if (type === 'sections' && selectedSubId) {
                await axios.post(`${API_BASE}/sections`, { name: newItemName, subcategoryId: selectedSubId });
                fetchSections(selectedSubId);
            } else if (type === 'items' && selectedSecId) {
                await axios.post(`${API_BASE}/checklist-items`, { label: newItemName, sectionId: selectedSecId });
                fetchItems(selectedSecId);
            }
            setNewItemName('');
        } catch (err) {
            console.error(err);
            alert('Error creating item');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm("Are you sure you want to delete this configuration item? Nested elements will be orphaned.")) return;

        try {
            await axios.delete(`${API_BASE}/${type}/${id}`);
            if (type === 'categories') fetchCategories();
            if (type === 'subcategories') fetchSubcategories(selectedCatId);
            if (type === 'sections') fetchSections(selectedSubId);
            if (type === 'checklist-items') fetchItems(selectedSecId);
        } catch (err) {
            console.error(err);
            alert('Error deleting item');
        }
    };

    const tabClass = (tabName) => `flex items-center px-4 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer ${activeTab === tabName ? 'bg-white border-t-4 border-blue-600 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-t-4 border-transparent'}`;

    return (
        <div className="max-w-6xl mx-auto pb-16">
            <div className="flex items-center mb-8">
                <Settings className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Dynamic Checklist Configuration</h1>
                    <p className="text-gray-500 font-semibold mt-1">Manage the core reporting schemas natively from the database.</p>
                </div>
            </div>

            <div className="flex space-x-2 border-b border-gray-200">
                <div onClick={() => setActiveTab('categories')} className={tabClass('categories')}>
                    <FolderTree className="w-4 h-4 mr-2" /> Categories
                </div>
                <div onClick={() => setActiveTab('subcategories')} className={tabClass('subcategories')}>
                    <Layers className="w-4 h-4 mr-2" /> Subcategories
                </div>
                <div onClick={() => setActiveTab('sections')} className={tabClass('sections')}>
                    <FileText className="w-4 h-4 mr-2" /> Sections
                </div>
                <div onClick={() => setActiveTab('items')} className={tabClass('items')}>
                    <CheckSquare className="w-4 h-4 mr-2" /> Checklist Items
                </div>
            </div>

            <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-200 border-t-0 p-8 shadow-sm min-h-[500px]">

                {/* CATEGORIES TAB */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Manage Categories</h2>
                        <form onSubmit={(e) => handleAdd(e, 'categories')} className="flex gap-4">
                            <input type="text" placeholder="New Category Name (e.g. Sport de montagne)" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg flex items-center shadow-sm disabled:opacity-50"><Plus className="w-5 h-5 mr-1" /> Add</button>
                        </form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {categories.map(cat => (
                                <div key={cat._id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                    <span className="font-bold text-lg text-gray-800">{cat.name}</span>
                                    <button onClick={() => handleDelete('categories', cat._id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                            {categories.length === 0 && <p className="text-gray-400 font-semibold col-span-2">No categories yet.</p>}
                        </div>
                    </div>
                )}

                {/* SUBCATEGORIES TAB */}
                {activeTab === 'subcategories' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Manage Subcategories</h2>

                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                            <label className="block text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">1. Select Parent Category</label>
                            <select value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">-- Choose a Category --</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        {selectedCatId && (
                            <div className="pt-4 border-t border-gray-100">
                                <form onSubmit={(e) => handleAdd(e, 'subcategories')} className="flex gap-4 mb-6">
                                    <input type="text" placeholder="New Subcategory Name (e.g. Habillement)" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg flex items-center shadow-sm disabled:opacity-50"><Plus className="w-5 h-5 mr-1" /> Add</button>
                                </form>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subcategories.map(sub => (
                                        <div key={sub._id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                            <span className="font-bold text-lg text-gray-800">{sub.name}</span>
                                            <button onClick={() => handleDelete('subcategories', sub._id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                    {subcategories.length === 0 && <p className="text-gray-400 font-semibold col-span-2">No subcategories linked to this category.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SECTIONS TAB */}
                {activeTab === 'sections' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Manage Sections</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-5 rounded-xl border border-gray-200">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">1. Category</label>
                                <select value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                                    <option value="">-- Select Category --</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">2. Subcategory</label>
                                <select value={selectedSubId} onChange={e => setSelectedSubId(e.target.value)} disabled={!selectedCatId} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none disabled:opacity-50">
                                    <option value="">-- Select Subcategory --</option>
                                    {subcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedSubId && (
                            <div className="pt-4 border-t border-gray-100">
                                <form onSubmit={(e) => handleAdd(e, 'sections')} className="flex gap-4 mb-6">
                                    <input type="text" placeholder="New Section Name (e.g. Magasin Rapide / LDMC)" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg flex items-center shadow-sm disabled:opacity-50"><Plus className="w-5 h-5 mr-1" /> Add</button>
                                </form>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sections.map(sec => (
                                        <div key={sec._id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                            <span className="font-bold text-lg text-gray-800">{sec.name}</span>
                                            <button onClick={() => handleDelete('sections', sec._id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                    {sections.length === 0 && <p className="text-gray-400 font-semibold col-span-2">No sections linked yet.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CHECKLIST ITEMS TAB */}
                {activeTab === 'items' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Manage Checklist Variables</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-100 p-5 rounded-xl border border-gray-200">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">1. Category</label>
                                <select value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                                    <option value="">-- Select Category --</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">2. Subcategory</label>
                                <select value={selectedSubId} onChange={e => setSelectedSubId(e.target.value)} disabled={!selectedCatId} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none disabled:opacity-50">
                                    <option value="">-- Subcategory --</option>
                                    {subcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">3. Section</label>
                                <select value={selectedSecId} onChange={e => setSelectedSecId(e.target.value)} disabled={!selectedSubId} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none disabled:opacity-50">
                                    <option value="">-- Section --</option>
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedSecId && (
                            <div className="pt-4 border-t border-gray-100">
                                <form onSubmit={(e) => handleAdd(e, 'items')} className="flex gap-4 mb-6">
                                    <input type="text" placeholder="New Checklist Label (e.g. Propreté des cabines)" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg flex items-center shadow-sm disabled:opacity-50"><Plus className="w-5 h-5 mr-1" /> Add</button>
                                </form>
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <div key={item._id} className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-gray-400 transition-colors">
                                            <div className="flex items-center">
                                                <CheckSquare className="w-5 h-5 text-green-500 mr-3" />
                                                <span className="font-bold text-gray-800 text-lg">{item.label}</span>
                                            </div>
                                            <button onClick={() => handleDelete('checklist-items', item._id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                    {items.length === 0 && <p className="text-gray-400 font-semibold">No checklist points added into this section yet.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}

export default ConfigPanel;
