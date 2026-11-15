import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import {
    FileText, TrendingUp, CheckCircle, AlertTriangle,
    Printer, Search, ArrowRight, Filter, Calendar, User, Eye, Plus
} from 'lucide-react';
import { API_BASE } from '../config';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard() {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [scoreFilter, setScoreFilter] = useState('ALL'); // 'ALL', 'HIGH', 'LOW'

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/audits`);
                setAudits(res.data || []);
            } catch (err) {
                console.error('Error fetching audits', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudits();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-bold text-sm">Chargement du tableau de bord...</p>
            </div>
        );
    }

    const totalAudits = audits.length;
    let totalYes = 0;
    let totalNo = 0;
    let subcategoryScores = {};

    audits.forEach(audit => {
        if (!audit.categories) return;
        audit.categories.forEach(cat => {
            cat.subcategories.forEach(sub => {
                if (!subcategoryScores[sub.name]) subcategoryScores[sub.name] = { yes: 0, total: 0 };
                sub.items.forEach(item => {
                    subcategoryScores[sub.name].total++;
                    if (item.value) {
                        totalYes++;
                        subcategoryScores[sub.name].yes++;
                    } else {
                        totalNo++;
                    }
                });
            });
        });
    });

    const averageScore = totalYes + totalNo > 0 ? Math.round((totalYes / (totalYes + totalNo)) * 100) : 0;

    const pieData = {
        labels: ['Conforme (OUI)', 'Non Conforme (NON)'],
        datasets: [{
            data: [totalYes, totalNo],
            backgroundColor: ['#10B981', '#EF4444'],
            hoverBackgroundColor: ['#059669', '#DC2626'],
            borderWidth: 2,
            borderColor: '#FFFFFF'
        }],
    };

    const barLabels = Object.keys(subcategoryScores);
    const barDataValues = barLabels.map(k => {
        const data = subcategoryScores[k];
        return data.total > 0 ? Math.round((data.yes / data.total) * 100) : 0;
    });

    const barData = {
        labels: barLabels,
        datasets: [{
            label: 'Taux de conformité (%)',
            data: barDataValues,
            backgroundColor: '#3B82F6',
            hoverBackgroundColor: '#2563EB',
            borderRadius: 8,
        }],
    };

    // Filter audits
    const filteredAudits = audits.filter(audit => {
        const matchesSearch =
            (audit.site || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (audit.performedBy || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Calculate score for filter
        let y = 0;
        let total = 0;
        if (audit.categories) {
            audit.categories.forEach(cat => {
                cat.subcategories?.forEach(sub => {
                    sub.items?.forEach(item => {
                        total++;
                        if (item.value) y++;
                    });
                });
            });
        }
        const score = total > 0 ? Math.round((y / total) * 100) : 0;

        if (scoreFilter === 'HIGH') return score >= 80;
        if (scoreFilter === 'LOW') return score < 80;
        return true;
    });

    return (
        <div className="space-y-8 pb-16">
            {/* HERO SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-blue-950/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Tableau de Contrôle Qualité Magasin
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                            Audit de Linéaire & Conformité
                        </h1>
                        <p className="text-blue-100 font-medium text-base sm:text-lg mt-2 opacity-90">
                            Suivi des standards d'agencement, facing, balisage et propreté de vos rayons en temps réel.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to="/new"
                            className="px-6 py-3.5 bg-white hover:bg-gray-100 text-blue-900 font-black rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-5 h-5 text-blue-600" />
                            <span>Nouvel Audit</span>
                        </Link>
                        <Link
                            to="/config"
                            className="px-5 py-3.5 bg-white/15 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-all text-sm flex items-center gap-2"
                        >
                            <span>Configurer Rayons</span>
                            <ArrowRight className="w-4 h-4 opacity-70" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Audits */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total Audits</p>
                        <h4 className="text-3xl font-black text-gray-900">{totalAudits}</h4>
                        <span className="text-xs font-semibold text-gray-500 mt-1 inline-block">Rapports archivés</span>
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <FileText className="w-7 h-7" />
                    </div>
                </div>

                {/* Global Score */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Score Global</p>
                            <h4 className="text-3xl font-black text-gray-900">{averageScore}%</h4>
                        </div>
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                                averageScore >= 80 ? 'bg-emerald-500' : averageScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${averageScore}%` }}
                        ></div>
                    </div>
                </div>

                {/* Compliant items */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Points Conformes</p>
                        <h4 className="text-3xl font-black text-emerald-600">{totalYes}</h4>
                        <span className="text-xs font-semibold text-gray-500 mt-1 inline-block">Critères validés (OUI)</span>
                    </div>
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <CheckCircle className="w-7 h-7" />
                    </div>
                </div>

                {/* Total Issues */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Anomalies Détectées</p>
                        <h4 className="text-3xl font-black text-rose-600">{totalNo}</h4>
                        <span className="text-xs font-semibold text-gray-500 mt-1 inline-block">Points à corriger (NON)</span>
                    </div>
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-black text-gray-900">Répartition Globale</h3>
                            <span className="text-xs font-bold text-gray-400 uppercase">Conformité</span>
                        </div>
                    </div>
                    <div className="h-60 flex items-center justify-center relative">
                        {totalYes + totalNo > 0 ? (
                            <Pie
                                data={pieData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } }
                                }}
                            />
                        ) : (
                            <p className="text-gray-400 font-semibold text-sm">Aucune donnée disponible</p>
                        )}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black text-gray-900">Score Moyen par Rayon (%)</h3>
                        <span className="text-xs font-bold text-gray-400 uppercase">Performance</span>
                    </div>
                    <div className="h-60">
                        {barLabels.length > 0 ? (
                            <Bar
                                data={barData}
                                options={{
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: { beginAtZero: true, max: 100, grid: { color: '#F3F4F6' } },
                                        x: { grid: { display: false } }
                                    },
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-gray-400 font-semibold text-sm">Aucune donnée de rayon enregistrée</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AUDITS HISTORY TABLE WITH SEARCH & FILTER */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Historique des Rapports d'Audit</h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {filteredAudits.length} rapport{filteredAudits.length > 1 ? 's' : ''} trouvé{filteredAudits.length > 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher magasin, auditeur..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-52 sm:w-64"
                            />
                        </div>

                        <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
                            <button
                                onClick={() => setScoreFilter('ALL')}
                                className={`px-3 py-1 rounded-lg transition-all ${
                                    scoreFilter === 'ALL' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setScoreFilter('HIGH')}
                                className={`px-3 py-1 rounded-lg transition-all ${
                                    scoreFilter === 'HIGH' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                ≥ 80%
                            </button>
                            <button
                                onClick={() => setScoreFilter('LOW')}
                                className={`px-3 py-1 rounded-lg transition-all ${
                                    scoreFilter === 'LOW' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                &lt; 80%
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/75">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Magasin / Site</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Auditeur</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Conformité</th>
                                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 text-sm">
                            {filteredAudits.map(audit => {
                                let y = 0;
                                let total = 0;
                                if (audit.categories) {
                                    audit.categories.forEach(cat => {
                                        cat.subcategories?.forEach(sub => {
                                            sub.items?.forEach(item => {
                                                total++;
                                                if (item.value) y++;
                                            });
                                        });
                                    });
                                }
                                const score = total > 0 ? Math.round((y / total) * 100) : 0;

                                return (
                                    <tr key={audit._id} className="hover:bg-blue-50/40 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {audit.siteImage ? (
                                                    <img
                                                        src={audit.siteImage.startsWith('http') ? audit.siteImage : `${API_BASE}${audit.siteImage}`}
                                                        className="w-10 h-10 rounded-xl object-cover mr-3.5 border border-gray-200 shadow-sm"
                                                        alt="Site"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 mr-3.5 flex items-center justify-center font-bold text-xs border border-blue-100">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-bold text-gray-900 block group-hover:text-blue-600 transition-colors">
                                                        {audit.site}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">Audit Complet</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-gray-700 font-semibold">
                                                <User className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                                                <span>{audit.performedBy || 'Non spécifié'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-gray-500 font-medium text-xs">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                                <span>{new Date(audit.date).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                                                        score >= 80
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : score >= 60
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}
                                                >
                                                    {score >= 80 ? (
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                    )}
                                                    {score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link
                                                to={`/audit/${audit._id}`}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Consulter</span>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredAudits.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                                        Aucun rapport ne correspond à votre recherche.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
