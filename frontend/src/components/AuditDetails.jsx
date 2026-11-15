import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import {
    ArrowLeft, CheckCircle, XCircle, Trash2, Calendar,
    User, FileImage, AlertTriangle, Download, ShieldCheck,
    Printer, Building2
} from 'lucide-react';
import { API_BASE } from '../config';

function AuditDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('ALL'); // 'ALL' or 'ISSUES_ONLY'
    const [isExporting, setIsExporting] = useState(false);
    const pdfReportRef = useRef();

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/audits/${id}`);
                setData(res.data);
            } catch (err) {
                console.error('Error fetching audit details', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce rapport d'audit ?")) {
            try {
                await axios.delete(`${API_BASE}/api/audits/${id}`);
                navigate('/');
            } catch (err) {
                console.error('Error deleting audit', err);
                alert('Échec de la suppression de l\'audit');
            }
        }
    };

    const handleDownloadPDF = () => {
        const element = pdfReportRef.current;
        if (!element) return;

        setIsExporting(true);

        // Small delay to ensure the DOM is painted in active layout
        setTimeout(() => {
            const opt = {
                margin: 0, // Zero margin so our exact 794x1123px A4 pages fit 100% without extra pages
                filename: `Rapport_Audit_${data.audit.site.replace(/\s+/g, '_')}_${new Date(data.audit.date).toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: 794
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            html2pdf()
                .from(element)
                .set(opt)
                .save()
                .then(() => {
                    setIsExporting(false);
                })
                .catch((err) => {
                    console.error('PDF generation error', err);
                    setIsExporting(false);
                });
        }, 200);
    };

    const handleNativePrint = () => {
        window.print();
    };

    // Helper: Build matrix of criteria across all subcategories in a department
    const buildDepartmentMatrix = (cat) => {
        const criteriaLabels = [];
        const seen = new Set();
        cat.subcategories?.forEach(sub => {
            sub.items?.forEach(item => {
                if (!seen.has(item.label)) {
                    seen.add(item.label);
                    criteriaLabels.push(item.label);
                }
            });
        });

        const rows = criteriaLabels.map(label => {
            const statuses = (cat.subcategories || []).map(sub => {
                const found = sub.items?.find(it => it.label === label);
                return found ? { value: found.value, comment: found.comment } : null;
            });
            return { label, statuses };
        });

        return {
            subcategories: cat.subcategories || [],
            rows
        };
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-bold text-sm">Chargement du rapport d'audit...</p>
            </div>
        );
    }

    if (!data || !data.audit) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="text-xl font-black text-gray-900 mb-2">Rapport introuvable</h3>
                <p className="text-gray-500 text-sm mb-6">Cet audit a peut-être été supprimé.</p>
                <Link to="/" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">
                    Retour au tableau de bord
                </Link>
            </div>
        );
    }

    const { audit, stats, categoriesStats } = data;

    // Extract all failed items across all categories
    const issues = [];
    if (audit.categories) {
        audit.categories.forEach(cat => {
            cat.subcategories?.forEach(sub => {
                sub.items?.forEach(item => {
                    if (!item.value) {
                        issues.push({
                            category: cat.name,
                            subcategory: sub.name,
                            label: item.label,
                            comment: item.comment,
                            photoUrl: item.photoUrl,
                            value: item.value
                        });
                    }
                });
            });
        });
    }

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-6">
            {/* Top action bar - Hidden in Print */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <Link
                    to="/"
                    className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-bold text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour au Dashboard
                </Link>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View mode toggle */}
                    <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-xs text-xs font-bold">
                        <button
                            onClick={() => setViewMode('ALL')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                viewMode === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Tous ({stats.totalItems})
                        </button>
                        <button
                            onClick={() => setViewMode('ISSUES_ONLY')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                viewMode === 'ISSUES_ONLY' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-rose-600'
                            }`}
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Anomalies ({issues.length})
                        </button>
                    </div>

                    {/* PDF Download Button (html2pdf) */}
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                        {isExporting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <span>Génération PDF (2 pages)...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                <span>Télécharger PDF (2 Pages Pro)</span>
                            </>
                        )}
                    </button>

                    {/* Native Print Dialog Button */}
                    <button
                        onClick={handleNativePrint}
                        className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-xs text-xs sm:text-sm cursor-pointer"
                        title="Imprimer ou enregistrer en PDF via la boîte de dialogue système"
                    >
                        <Printer className="w-4 h-4 mr-2 text-slate-300" />
                        <span>Imprimer A4</span>
                    </button>

                    <button
                        onClick={handleDelete}
                        className="flex items-center text-rose-600 hover:text-rose-700 font-bold px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors shadow-xs text-xs sm:text-sm cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
                    </button>
                </div>
            </div>

            {/* Exporting Loading Overlay */}
            {isExporting && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100000] flex flex-col items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                    <p className="text-base font-bold">Génération du rapport PDF de synthèse...</p>
                    <p className="text-xs text-blue-200 mt-1">Mise en page compacte A4 (2 pages professionnelles)</p>
                </div>
            )}

            {/* ============================================================== */}
            {/* 1. ON-SCREEN INTERACTIVE REPORT VIEW (Hidden during print)     */}
            {/* ============================================================== */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200/80 p-6 sm:p-10 text-gray-800 space-y-8 print:hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-100 pb-8 gap-6">
                    <div className="flex flex-row items-center gap-5">
                        {audit.siteImage ? (
                            <img
                                src={audit.siteImage.startsWith('http') ? audit.siteImage : `${API_BASE}${audit.siteImage}`}
                                alt="Site Front"
                                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl shadow-xs border border-gray-200"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#0082C3]/10 rounded-2xl border border-[#0082C3]/20 flex flex-col items-center justify-center text-[#0082C3]">
                                <Building2 className="w-8 h-8 mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#0082C3]">DECATHLON</span>
                            </div>
                        )}

                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider mb-2">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Rapport d'Audit Qualité Linéaire
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                {audit.site}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs">
                                <div className="flex items-center text-gray-600 font-bold">
                                    <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
                                    <span>{new Date(audit.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="flex items-center text-gray-600 font-bold">
                                    <User className="w-4 h-4 mr-1.5 text-blue-600" />
                                    <span>Auditeur: {audit.performedBy || 'Non spécifié'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                        <div
                            className={`flex flex-col items-center justify-center px-7 py-4 rounded-2xl border-2 ${
                                stats.percentage >= 80
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : stats.percentage >= 60
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-80">Score Global</span>
                            <span className="text-4xl sm:text-5xl font-black leading-none">{stats.percentage}%</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                                    stats.percentage >= 80
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : 'bg-rose-100 text-rose-800 border-rose-200'
                                }`}
                            >
                                {stats.percentage >= 80 ? 'Conforme' : 'Action Requise'}
                            </span>

                            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {stats.issuesCount} Anomalie{stats.issuesCount > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Issues section on screen */}
                {issues.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-rose-800 flex items-center">
                                <span className="bg-rose-600 w-2 h-5 mr-2.5 rounded-full"></span>
                                Points Non-Conformes Détectés ({issues.length})
                            </h3>
                            <span className="text-xs text-rose-500 font-bold">À traiter en priorité</span>
                        </div>

                        <div className="space-y-3">
                            {issues.map((issue, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 gap-4"
                                >
                                    <div className="flex-1 border-l-4 border-rose-500 pl-3.5 py-0.5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                                                {issue.category}
                                            </span>
                                            <span className="text-xs font-bold text-gray-500">• {issue.subcategory}</span>
                                        </div>
                                        <h4 className="text-base font-bold text-gray-900">{issue.label}</h4>

                                        {issue.comment && (
                                            <p className="text-xs text-gray-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-rose-100 inline-block mt-2">
                                                Note: "{issue.comment}"
                                            </p>
                                        )}
                                    </div>

                                    {issue.photoUrl && (
                                        <div className="shrink-0 w-28 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-xs">
                                            <img
                                                src={issue.photoUrl.startsWith('http') ? issue.photoUrl : `${API_BASE}${issue.photoUrl}`}
                                                alt="Issue Proof"
                                                crossOrigin="anonymous"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detailed breakdown on screen */}
                {viewMode === 'ALL' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
                            <h3 className="text-xl font-black text-gray-900 flex items-center">
                                <span className="bg-gray-800 w-2 h-6 mr-3 rounded-full"></span>
                                Détail par Département & Rayon
                            </h3>
                            <span className="text-xs font-bold text-gray-400 uppercase">Audit Linéaire</span>
                        </div>

                        <div className="space-y-8">
                            {audit.categories && audit.categories.map((cat, cIdx) => {
                                const catStats = categoriesStats?.[cIdx];
                                return (
                                    <div key={cIdx} className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 flex justify-between items-center">
                                            <div>
                                                <h4 className="text-lg font-black uppercase tracking-wider text-gray-900">
                                                    {cat.name}
                                                </h4>
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {catStats?.valid || 0} / {catStats?.total || 0} critères validés
                                                </span>
                                            </div>
                                            <span
                                                className={`font-black text-sm px-3.5 py-1 rounded-xl border ${
                                                    (catStats?.percentage || 0) >= 80
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}
                                            >
                                                {catStats?.percentage || 0}%
                                            </span>
                                        </div>

                                        <div className="space-y-4 pl-2">
                                            {cat.subcategories?.map((sub, sIdx) => {
                                                const subStats = catStats?.subcategories?.[sIdx];
                                                return (
                                                    <div key={sIdx} className="border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
                                                        <div className="bg-gray-100/80 px-5 py-3 flex justify-between items-center border-b border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-gray-800 text-sm">{sub.name}</span>
                                                                <span className="text-xs text-gray-400 font-semibold">({sub.items.length} points)</span>
                                                            </div>
                                                            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                                                                {subStats?.percentage || 0}%
                                                            </span>
                                                        </div>

                                                        <div className="divide-y divide-gray-100 bg-white">
                                                            {sub.items.map((item, idx) => (
                                                                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                                                                    <div className="flex items-center gap-3 flex-1 pr-4">
                                                                        {item.value ? (
                                                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                        ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                                                        )}
                                                                        <div>
                                                                            <p className={`font-bold text-xs sm:text-sm ${item.value ? 'text-gray-800' : 'text-rose-950 font-black'}`}>
                                                                                {item.label}
                                                                            </p>
                                                                            {item.comment && (
                                                                                <p className="text-xs italic text-gray-500 mt-0.5">Note: "{item.comment}"</p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-3 shrink-0">
                                                                        {item.photoUrl && (
                                                                            <img
                                                                                src={item.photoUrl.startsWith('http') ? item.photoUrl : `${API_BASE}${item.photoUrl}`}
                                                                                className="h-10 w-14 object-cover rounded-lg border border-gray-200"
                                                                                alt="preuve"
                                                                            />
                                                                        )}
                                                                        <span
                                                                            className={`px-2.5 py-1 rounded-md text-xs font-black ${
                                                                                item.value
                                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                            }`}
                                                                        >
                                                                            {item.value ? 'OUI' : 'NON'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 2. DEDICATED EXECUTIVE PRINT / PDF TEMPLATE (STRICT 2-PAGE A4 LAYOUT)     */}
            {/* ========================================================================= */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: isExporting ? 0 : '-99999px',
                    width: '794px',
                    zIndex: isExporting ? 99999 : -100,
                    opacity: isExporting ? 1 : 0,
                    pointerEvents: 'none',
                    backgroundColor: '#FFFFFF'
                }}
            >
                <div ref={pdfReportRef} id="pdf-print-root" style={{ width: '794px', backgroundColor: '#FFFFFF', color: '#0F172A' }}>
                    {/* ================================================================= */}
                    {/* --- PDF PAGE 1: SYNTHÈSE EXÉCUTIVE & PLAN D'ACTION ---            */}
                    {/* ================================================================= */}
                    <div
                        style={{
                            width: '794px',
                            height: '1123px',
                            maxHeight: '1123px',
                            boxSizing: 'border-box',
                            padding: '32px 36px',
                            overflow: 'hidden',
                            pageBreakAfter: 'always',
                            backgroundColor: '#FFFFFF',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Decathlon Navy Accent Top Bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: '#0082C3' }}></div>

                        {/* Top Header */}
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4 pt-1">
                            <div className="flex items-center gap-3.5">
                                {audit.siteImage ? (
                                    <img
                                        src={audit.siteImage.startsWith('http') ? audit.siteImage : `${API_BASE}${audit.siteImage}`}
                                        className="w-14 h-14 object-cover rounded-xl border border-slate-300 shadow-xs"
                                        alt="Magasin"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-[#0082C3] flex items-center justify-center font-black text-white text-lg shadow-xs">
                                        DEC
                                    </div>
                                )}
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#0082C3] block">
                                        Rapport d'Audit Qualité Linéaire
                                    </span>
                                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                        {audit.site}
                                    </h1>
                                    <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500 mt-0.5">
                                        <span>📅 Date: {new Date(audit.date).toLocaleDateString('fr-FR')}</span>
                                        <span>👤 Auditeur: {audit.performedBy || 'Non spécifié'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Score Card */}
                            <div className="text-right">
                                <div
                                    className={`px-4 py-2 rounded-xl border-2 text-center min-w-[110px] ${
                                        stats.percentage >= 80
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                            : stats.percentage >= 60
                                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                                            : 'bg-rose-50 border-rose-400 text-rose-800'
                                    }`}
                                >
                                    <span className="text-[8px] font-black uppercase tracking-widest block opacity-75">Score Global</span>
                                    <span className="text-2xl font-black leading-none">{stats.percentage}%</span>
                                    <span
                                        className={`text-[8px] font-black uppercase tracking-wider block mt-0.5 px-1.5 py-0.2 rounded ${
                                            stats.percentage >= 80 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                                        }`}
                                    >
                                        {stats.percentage >= 80 ? 'CONFORME' : 'ACTION REQUISE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Executive KPI Bar */}
                        <div className="grid grid-cols-4 gap-2.5 mb-4">
                            <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-center">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total Points</span>
                                <span className="text-base font-black text-slate-900">{stats.totalItems}</span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 block">Conformes</span>
                                <span className="text-base font-black text-emerald-700">
                                    {stats.validItems} <span className="text-[9px] font-semibold text-emerald-600">({stats.totalItems > 0 ? Math.round((stats.validItems / stats.totalItems) * 100) : 0}%)</span>
                                </span>
                            </div>
                            <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-center">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 block">Anomalies</span>
                                <span className="text-base font-black text-rose-700">{stats.issuesCount}</span>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl text-center">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block">Départements</span>
                                <span className="text-base font-black text-blue-800">{audit.categories ? audit.categories.length : 0}</span>
                            </div>
                        </div>

                        {/* Performance par Département */}
                        <div className="mb-4">
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-3 bg-[#0082C3] rounded-full"></span>
                                Performance par Département
                            </h2>
                            <div className="grid grid-cols-2 gap-2.5">
                                {audit.categories && audit.categories.map((cat, idx) => {
                                    const catStats = categoriesStats?.[idx];
                                    const pct = catStats?.percentage || 0;
                                    return (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-xs text-slate-900 truncate">{cat.name}</span>
                                                <span className={`text-xs font-black ${pct >= 80 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {pct}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                                                <span>{cat.subcategories ? cat.subcategories.length : 0} Rayons</span>
                                                <span>{catStats?.valid || 0} / {catStats?.total || 0} conformes</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Plan d'Action / Anomalies Détectées */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                                    <span className="w-1.5 h-3 bg-rose-600 rounded-full"></span>
                                    Plan d'Action Prioritaire — Non-Conformités ({issues.length})
                                </h2>
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    Actions correctives à traiter
                                </span>
                            </div>

                            {issues.length > 0 ? (
                                <table className="w-full border-collapse border border-slate-200 text-xs">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                                            <th className="border border-slate-200 p-1.5 text-center w-8">N°</th>
                                            <th className="border border-slate-200 p-1.5 text-left w-36">Rayon</th>
                                            <th className="border border-slate-200 p-1.5 text-left">Critère Défaillant</th>
                                            <th className="border border-slate-200 p-1.5 text-left w-40">Observation / Note</th>
                                            <th className="border border-slate-200 p-1.5 text-center w-14">Preuve</th>
                                            <th className="border border-slate-200 p-1.5 text-center w-16">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issues.slice(0, 8).map((issue, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/20'}>
                                                <td className="border border-slate-200 p-1.5 font-bold text-slate-400 text-center text-[9px]">
                                                    {idx + 1}
                                                </td>
                                                <td className="border border-slate-200 p-1.5 font-bold text-slate-800">
                                                    <span className="text-[8px] text-slate-400 uppercase block font-semibold">{issue.category}</span>
                                                    {issue.subcategory}
                                                </td>
                                                <td className="border border-slate-200 p-1.5 font-bold text-rose-950">
                                                    {issue.label}
                                                </td>
                                                <td className="border border-slate-200 p-1.5 text-slate-600 italic text-[10px]">
                                                    {issue.comment ? `"${issue.comment}"` : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="border border-slate-200 p-1 text-center">
                                                    {issue.photoUrl ? (
                                                        <img
                                                            src={issue.photoUrl.startsWith('http') ? issue.photoUrl : `${API_BASE}${issue.photoUrl}`}
                                                            alt="Preuve"
                                                            className="w-10 h-7 object-cover rounded mx-auto border border-slate-300"
                                                            crossOrigin="anonymous"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-300 text-[9px]">-</span>
                                                    )}
                                                </td>
                                                <td className="border border-slate-200 p-1.5 text-center">
                                                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 font-black text-[8px] rounded uppercase">
                                                        À CORRIGER
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {issues.length > 8 && (
                                            <tr>
                                                <td colSpan="6" className="p-1.5 text-center text-[9px] text-slate-500 font-bold bg-slate-50 border border-slate-200">
                                                    + {issues.length - 8} autres anomalies répertoriées dans la matrice complète en Page 2
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                                    <span className="text-emerald-800 font-bold text-sm block">
                                        ✅ Aucune anomalie détectée !
                                    </span>
                                    <span className="text-emerald-600 text-xs mt-1 block">
                                        L'ensemble des critères d'inspection sont 100% conformes aux standards de merchandising.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Page 1 Footer */}
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-semibold mt-auto">
                            <span>QC Audit Pro • Système de Contrôle Linéaire Décathlon</span>
                            <span>Page 1 / 2</span>
                        </div>
                    </div>

                    {/* ================================================================= */}
                    {/* --- PDF PAGE 2: GRILLE D'ÉVALUATION DÉTAILLÉE & SIGNATURES ---    */}
                    {/* ================================================================= */}
                    <div
                        style={{
                            width: '794px',
                            height: '1123px',
                            maxHeight: '1123px',
                            boxSizing: 'border-box',
                            padding: '32px 36px',
                            overflow: 'hidden',
                            pageBreakAfter: 'always',
                            backgroundColor: '#FFFFFF',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Decathlon Navy Accent Top Bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: '#0082C3' }}></div>

                        {/* Top Header Page 2 */}
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3 pt-1">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#0082C3] block">
                                    Grille de Contrôle Détaillée
                                </span>
                                <h2 className="text-lg font-black text-slate-900 uppercase">
                                    {audit.site} — Évaluation Exhaustive par Rayon
                                </h2>
                            </div>
                            <div className="text-right text-[10px] font-semibold text-slate-500">
                                <span>Date: {new Date(audit.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                        </div>

                        {/* Matrices for Departments */}
                        <div className="flex-1 space-y-3.5">
                            {audit.categories && audit.categories.map((cat, cIdx) => {
                                const matrix = buildDepartmentMatrix(cat);
                                const catStats = categoriesStats?.[cIdx];

                                return (
                                    <div key={cIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                                        {/* Department Header */}
                                        <div className="bg-slate-800 text-white px-3 py-1 flex justify-between items-center text-xs">
                                            <span className="font-black uppercase tracking-wider text-[11px]">
                                                Département : {cat.name}
                                            </span>
                                            <span className="font-bold text-[9px] bg-slate-700 px-2 py-0.5 rounded text-white">
                                                Conformité : {catStats?.percentage || 0}%
                                            </span>
                                        </div>

                                        {/* Matrix Table */}
                                        <table className="w-full border-collapse text-[9.5px]">
                                            <thead>
                                                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                    <th className="p-1 text-left font-black w-48 border-r border-slate-200 pl-2">
                                                        Critères de Contrôle
                                                    </th>
                                                    {matrix.subcategories.map((sub, sIdx) => {
                                                        const subStats = catStats?.subcategories?.[sIdx];
                                                        return (
                                                            <th key={sIdx} className="p-1 text-center border-r border-slate-200 last:border-r-0">
                                                                <div className="font-black text-slate-900 truncate">{sub.name}</div>
                                                                <div className="text-[8.5px] font-bold text-[#0082C3]">
                                                                    {subStats?.percentage || 0}%
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {matrix.rows.map((row, rIdx) => (
                                                    <tr
                                                        key={rIdx}
                                                        className={`border-b border-slate-100 ${
                                                            rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                                        }`}
                                                    >
                                                        <td className="p-1 font-bold text-slate-800 border-r border-slate-200 pl-2 truncate">
                                                            {row.label}
                                                        </td>
                                                        {row.statuses.map((st, sIdx) => (
                                                            <td
                                                                key={sIdx}
                                                                className="p-1 text-center border-r border-slate-200 last:border-r-0"
                                                            >
                                                                {st ? (
                                                                    st.value ? (
                                                                        <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black text-[8.5px]">
                                                                            ✓ OUI
                                                                        </span>
                                                                    ) : (
                                                                        <div>
                                                                            <span className="inline-block px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 font-black text-[8.5px]">
                                                                                ✗ NON
                                                                            </span>
                                                                            {st.comment && (
                                                                                <span className="block text-[7.5px] text-rose-600 italic truncate max-w-[70px] mx-auto">
                                                                                    "{st.comment}"
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Validation & Official Signatures Block */}
                        <div className="border-t-2 border-slate-200 pt-2.5 mt-3">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                                Visa & Signatures d'Approbation
                            </h4>
                            <div className="grid grid-cols-2 gap-3.5">
                                <div className="border border-slate-300 rounded-xl p-2 bg-slate-50/60 h-16 flex flex-col justify-between">
                                    <div className="text-[9px] font-bold text-slate-700">
                                        Visa de l'Auditeur : <span className="font-black text-slate-900">{audit.performedBy || 'Auditeur'}</span>
                                    </div>
                                    <div className="border-b border-dashed border-slate-300 pb-0.5 text-[8px] text-slate-400">
                                        Signature / Date : {new Date(audit.date).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                <div className="border border-slate-300 rounded-xl p-2 bg-slate-50/60 h-16 flex flex-col justify-between">
                                    <div className="text-[9px] font-bold text-slate-700">
                                        Visa de la Direction de Magasin
                                    </div>
                                    <div className="border-b border-dashed border-slate-300 pb-0.5 text-[8px] text-slate-400">
                                        Cachet & Signature :
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page 2 Footer */}
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-semibold mt-auto">
                            <span>QC Audit Pro • Document d'Exploitation Décathlon</span>
                            <span>Page 2 / 2</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuditDetails;
