import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Settings, Plus, Trash2, Edit3, FolderTree, Layers,
    CheckSquare, RefreshCw, X, Check, AlertCircle, Sparkles, Search
} from 'lucide-react';
import { API_BASE } from '../config';

const CONFIG_API = `${API_BASE}/api/config`;

function ConfigPanel() {
    const [tree, setTree] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals & form state
    const [isRayonModalOpen, setIsRayonModalOpen] = useState(false);
    const [editingRayon, setEditingRayon] = useState(null); // null if adding, { _id, name, categoryId } if editing
    const [rayonName, setRayonName] = useState('');
    const [rayonCategoryId, setRayonCategoryId] = useState('');
    const [withDefaultCriteria, setWithDefaultCriteria] = useState(true);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [initialRayonsText, setInitialRayonsText] = useState('');
    const [catWithDefaults, setCatWithDefaults] = useState(true);

    // Inline criterion editing
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemText, setEditingItemText] = useState('');

    // New criterion form per rayon
    const [activeRayonForNewItem, setActiveRayonForNewItem] = useState(null);
    const [newItemLabel, setNewItemLabel] = useState('');

    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [treeRes, catsRes] = await Promise.all([
                axios.get(`${CONFIG_API}/tree`),
                axios.get(`${CONFIG_API}/categories`)
            ]);
            setTree(treeRes.data || []);
            setCategories(catsRes.data || []);
        } catch (err) {
            console.error('Error loading config data', err);
            showNotification('Erreur lors du chargement des configurations', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- RAYON (Subcategory) CRUD ---
    const openAddRayonModal = (preselectedCatId = '') => {
        setEditingRayon(null);
        setRayonName('');
        const catId = preselectedCatId || (selectedCategoryFilter !== 'ALL' ? selectedCategoryFilter : (categories[0]?._id || ''));
        setRayonCategoryId(catId);
        setWithDefaultCriteria(true);
        setIsRayonModalOpen(true);
    };

    const openEditRayonModal = (sub, parentCatId) => {
        setEditingRayon(sub);
        setRayonName(sub.name);
        setRayonCategoryId(parentCatId || sub.categoryId || '');
        setWithDefaultCriteria(false);
        setIsRayonModalOpen(true);
    };

    const handleSaveRayon = async (e) => {
        e.preventDefault();
        if (!rayonName.trim() || !rayonCategoryId) return;

        setActionLoading(true);
        try {
            if (editingRayon) {
                // Update
                await axios.put(`${CONFIG_API}/subcategories/${editingRayon._id}`, {
                    name: rayonName.trim(),
                    categoryId: rayonCategoryId
                });
                showNotification(`Rayon "${rayonName}" modifié avec succès !`);
            } else {
                // Create
                await axios.post(`${CONFIG_API}/subcategories`, {
                    name: rayonName.trim(),
                    categoryId: rayonCategoryId,
                    withDefaultCriteria
                });
                showNotification(`Nouveau rayon "${rayonName}" ajouté !`);
            }
            setIsRayonModalOpen(false);
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors de la sauvegarde du rayon', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRayon = async (subId, subName) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le rayon "${subName}" et tous ses critères ?`)) {
            return;
        }

        setActionLoading(true);
        try {
            await axios.delete(`${CONFIG_API}/subcategories/${subId}`);
            showNotification(`Rayon "${subName}" supprimé.`);
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors de la suppression du rayon', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- CATEGORY CRUD ---
    const openAddCategoryModal = () => {
        setEditingCategory(null);
        setCategoryName('');
        setInitialRayonsText('');
        setCatWithDefaults(true);
        setIsCategoryModalOpen(true);
    };

    const openEditCategoryModal = (cat) => {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setInitialRayonsText('');
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;

        setActionLoading(true);
        try {
            if (editingCategory) {
                await axios.put(`${CONFIG_API}/categories/${editingCategory._id}`, {
                    name: categoryName.trim()
                });
                showNotification(`Département "${categoryName}" renommé.`);
            } else {
                const initialRayons = initialRayonsText
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);

                const res = await axios.post(`${CONFIG_API}/categories`, {
                    name: categoryName.trim(),
                    initialRayons,
                    withDefaultCriteria: catWithDefaults
                });
                showNotification(`Nouveau département "${categoryName}" créé avec succès !`);
                if (!rayonCategoryId) setRayonCategoryId(res.data._id);
            }
            setIsCategoryModalOpen(false);
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors de la sauvegarde du département', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCategory = async (catId, catName) => {
        if (!window.confirm(`Supprimer le département "${catName}" ? Tous les rayons et critères rattachés seront supprimés.`)) {
            return;
        }

        setActionLoading(true);
        try {
            await axios.delete(`${CONFIG_API}/categories/${catId}`);
            showNotification(`Département "${catName}" supprimé.`);
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors de la suppression du département', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- CRITERIA / CHECKLIST ITEMS CRUD ---
    const handleAddCriterion = async (subId) => {
        if (!newItemLabel.trim()) return;
        setActionLoading(true);
        try {
            await axios.post(`${CONFIG_API}/checklist-items`, {
                label: newItemLabel.trim(),
                subcategoryId: subId
            });
            setNewItemLabel('');
            setActiveRayonForNewItem(null);
            showNotification('Critère ajouté avec succès.');
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors de l\'ajout du critère', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveEditCriterion = async (itemId) => {
        if (!editingItemText.trim()) return;
        setActionLoading(true);
        try {
            await axios.put(`${CONFIG_API}/checklist-items/${itemId}`, {
                label: editingItemText.trim()
            });
            setEditingItemId(null);
            setEditingItemText('');
            showNotification('Critère mis à jour.');
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors de la mise à jour du critère', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCriterion = async (itemId) => {
        try {
            await axios.delete(`${CONFIG_API}/checklist-items/${itemId}`);
            showNotification('Critère retiré.');
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors de la suppression du critère', 'error');
        }
    };

    // --- SEED / RESET DEFAULT TEMPLATE ---
    const handleSeedDefaults = async () => {
        if (!window.confirm("Voulez-vous charger/synchroniser la structure standard (Randonnée & Sport d'eau avec les 12 critères) ?")) {
            return;
        }
        setActionLoading(true);
        try {
            await axios.post(`${CONFIG_API}/seed-default`, { reset: false });
            showNotification('Structure standard chargée avec succès !');
            loadData();
        } catch (err) {
            console.error(err);
            showNotification('Erreur lors du chargement du modèle', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter tree by category and search keyword
    const filteredTree = (selectedCategoryFilter === 'ALL'
        ? tree
        : tree.filter(cat => cat._id === selectedCategoryFilter))
        .map(cat => {
            if (!searchTerm.trim()) return cat;
            const term = searchTerm.toLowerCase();
            const matchingSubs = (cat.subcategories || []).filter(sub =>
                sub.name.toLowerCase().includes(term) ||
                (sub.items || []).some(item => item.label.toLowerCase().includes(term))
            );
            return { ...cat, subcategories: matchingSubs };
        })
        .filter(cat => (cat.subcategories && cat.subcategories.length > 0) || !searchTerm.trim());

    // Calculate total rayons
    const totalRayons = tree.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0);
    const totalCriteria = tree.reduce((acc, cat) => {
        return acc + (cat.subcategories?.reduce((sAcc, sub) => sAcc + (sub.items?.length || 0), 0) || 0);
    }, 0);

    return (
        <div className="max-w-7xl mx-auto pb-20 px-2 sm:px-4">
            {/* Header & Notifications */}
            {notification && (
                <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 transition-all ${
                    notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                    <Check className="w-5 h-5" />
                    <span>{notification.msg}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                        <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuration des Rayons & Critères</h1>
                        <p className="text-sm text-gray-500 font-semibold mt-1">
                            Gérez les rayons de votre magasin, leurs détails et les critères d'évaluation de l'audit.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleSeedDefaults}
                        disabled={actionLoading}
                        className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm flex items-center gap-2 border border-indigo-200 transition-colors cursor-pointer"
                        title="Charger ou synchroniser les rayons Randonnée et Sport d'eau"
                    >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Charger Modèle Standard
                    </button>

                    <button
                        onClick={openAddCategoryModal}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <FolderTree className="w-4 h-4" />
                        + Département
                    </button>

                    <button
                        onClick={() => openAddRayonModal()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        Nouveau Rayon
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Départements</div>
                        <div className="text-2xl font-black text-gray-900 mt-1">{categories.length}</div>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FolderTree className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Rayons configurés</div>
                        <div className="text-2xl font-black text-gray-900 mt-1">{totalRayons}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Layers className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Critères / Points</div>
                        <div className="text-2xl font-black text-gray-900 mt-1">{totalCriteria}</div>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><CheckSquare className="w-6 h-6" /></div>
                </div>
            </div>

            {/* Department Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setSelectedCategoryFilter('ALL')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                            selectedCategoryFilter === 'ALL'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        Tous les rayons ({totalRayons})
                    </button>
                    {categories.map(cat => {
                        const catSubsCount = tree.find(t => t._id === cat._id)?.subcategories?.length || 0;
                        return (
                            <button
                                key={cat._id}
                                onClick={() => setSelectedCategoryFilter(cat._id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                    selectedCategoryFilter === cat._id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                {cat.name} ({catSubsCount})
                            </button>
                        );
                    })}
                </div>

                {/* Search input */}
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Filtrer rayon ou critère..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-60"
                    />
                </div>
            </div>

            {/* Loading Spinner */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 font-bold">Chargement des rayons...</p>
                </div>
            ) : filteredTree.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun rayon configuré</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm">
                        Vous pouvez ajouter un nouveau département et rayon, ou charger en un clic le modèle standard Decathlon (Randonnée & Sport d'eau).
                    </p>
                    <button
                        onClick={handleSeedDefaults}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer shadow-md"
                    >
                        <Sparkles className="w-5 h-5" />
                        Charger le modèle standard maintenant
                    </button>
                </div>
            ) : (
                /* Categories and their Rayons */
                <div className="space-y-10">
                    {filteredTree.map(cat => (
                        <div key={cat._id} className="space-y-4">
                            {/* Category Header */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-6 bg-blue-500 rounded-full"></span>
                                    <h2 className="text-xl font-black uppercase tracking-wider">{cat.name}</h2>
                                    <span className="text-xs bg-gray-700 text-gray-300 font-bold px-3 py-1 rounded-full">
                                        {cat.subcategories?.length || 0} Rayons
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openAddRayonModal(cat._id)}
                                        className="text-xs font-bold bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Ajouter un Rayon
                                    </button>
                                    <button
                                        onClick={() => openEditCategoryModal(cat)}
                                        className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                                        title="Renommer le département"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(cat._id, cat.name)}
                                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                                        title="Supprimer ce département"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Rayons Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {(cat.subcategories || []).map(sub => (
                                    <div
                                        key={sub._id}
                                        className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all"
                                    >
                                        {/* Rayon Header */}
                                        <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-xl text-gray-900">{sub.name}</span>
                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                                                        {sub.items?.length || 0} critères
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400 font-semibold">Département: {cat.name}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => openEditRayonModal(sub, cat._id)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Modifier le nom ou département du rayon"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRayon(sub._id, sub.name)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Supprimer ce rayon"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rayon Criteria / Details List */}
                                        <div className="p-5 flex-1 space-y-2 max-h-80 overflow-y-auto">
                                            {(sub.items || []).map((item, idx) => (
                                                <div
                                                    key={item._id || idx}
                                                    className="group flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all text-sm"
                                                >
                                                    {editingItemId === item._id ? (
                                                        <div className="flex items-center gap-2 w-full">
                                                            <input
                                                                type="text"
                                                                value={editingItemText}
                                                                onChange={e => setEditingItemText(e.target.value)}
                                                                className="flex-1 px-3 py-1 bg-white border border-blue-400 rounded-lg outline-none font-semibold text-gray-800 text-sm"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleSaveEditCriterion(item._id)}
                                                                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                                                                title="Enregistrer"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingItemId(null)}
                                                                className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 cursor-pointer"
                                                                title="Annuler"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2.5 flex-1 pr-3">
                                                                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                <span className="font-bold text-gray-800">{item.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingItemId(item._id);
                                                                        setEditingItemText(item.label);
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-blue-600 rounded cursor-pointer"
                                                                    title="Modifier ce critère"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCriterion(item._id)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                                                                    title="Supprimer ce critère"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}

                                            {(!sub.items || sub.items.length === 0) && (
                                                <p className="text-xs text-gray-400 italic text-center py-4">
                                                    Aucun critère dans ce rayon. Cliquez ci-dessous pour en ajouter un.
                                                </p>
                                            )}
                                        </div>

                                        {/* Add Criterion Footer */}
                                        <div className="p-4 border-t border-gray-100 bg-gray-50/40">
                                            {activeRayonForNewItem === sub._id ? (
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        handleAddCriterion(sub._id);
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Facing de détail, Balisage..."
                                                        value={newItemLabel}
                                                        onChange={e => setNewItemLabel(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={actionLoading || !newItemLabel.trim()}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black disabled:opacity-50 cursor-pointer"
                                                    >
                                                        Ajouter
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveRayonForNewItem(null);
                                                            setNewItemLabel('');
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setActiveRayonForNewItem(sub._id);
                                                        setNewItemLabel('');
                                                    }}
                                                    className="w-full py-2 border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                                >
                                                    <Plus className="w-4 h-4" /> Ajouter un critère à ce rayon
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(!cat.subcategories || cat.subcategories.length === 0) && (
                                    <div className="col-span-2 p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                                        <p className="text-gray-500 font-semibold text-sm mb-3">Aucun rayon rattaché à ce département.</p>
                                        <button
                                            onClick={() => openAddRayonModal(cat._id)}
                                            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 cursor-pointer"
                                        >
                                            + Créer le premier rayon pour {cat.name}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- MODAL: AJOUTER / MODIFIER UN RAYON --- */}
            {isRayonModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                            <h3 className="text-xl font-black text-gray-900">
                                {editingRayon ? 'Modifier le Rayon' : 'Ajouter un Nouveau Rayon'}
                            </h3>
                            <button
                                onClick={() => setIsRayonModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRayon} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Département Parent
                                </label>
                                <select
                                    value={rayonCategoryId}
                                    onChange={e => setRayonCategoryId(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">-- Choisir un département --</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Nom du Rayon
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Homme, Surf, Natation / Lunette..."
                                    value={rayonName}
                                    onChange={e => setRayonName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    autoFocus
                                />
                            </div>

                            {!editingRayon && (
                                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="withDefaults"
                                        checked={withDefaultCriteria}
                                        onChange={e => setWithDefaultCriteria(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                                    />
                                    <label htmlFor="withDefaults" className="text-xs text-blue-900 font-semibold cursor-pointer">
                                        <strong className="block text-blue-950 font-bold">Ajouter les 12 critères standards</strong>
                                        Facing de détail, Balisage et prix buste, Rupture visuelle, Propreté, etc.
                                    </label>
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsRayonModalOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !rayonName.trim() || !rayonCategoryId}
                                    className="px-6 py-2 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                                >
                                    {editingRayon ? 'Mettre à jour' : 'Créer le Rayon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL: AJOUTER / RENOMMER UN DÉPARTEMENT --- */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                            <h3 className="text-xl font-black text-gray-900">
                                {editingCategory ? 'Renommer le Département' : 'Nouveau Département'}
                            </h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Nom du Département (Category)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Fitness, Sports Collectifs, Cycle..."
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    autoFocus
                                />
                            </div>

                            {!editingCategory && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                            Rayons de ce département (Optionnel)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Musculation, Cardio, Habillement (séparés par des virgules)"
                                            value={initialRayonsText}
                                            onChange={e => setInitialRayonsText(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Astuce: Séparez les noms de rayons par une virgule pour les créer en une seule fois.
                                        </p>
                                    </div>

                                    <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="catWithDefaults"
                                            checked={catWithDefaults}
                                            onChange={e => setCatWithDefaults(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                                        />
                                        <label htmlFor="catWithDefaults" className="text-xs text-blue-900 font-semibold cursor-pointer">
                                            <strong className="block text-blue-950 font-bold">Ajouter les 12 critères standards à chaque rayon</strong>
                                            Facing de détail, Balisage, Rupture visuelle, Propreté, etc.
                                        </label>
                                    </div>
                                </>
                            )}

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !categoryName.trim()}
                                    className="px-6 py-2 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                                >
                                    {editingCategory ? 'Enregistrer' : 'Créer le Département'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConfigPanel;
