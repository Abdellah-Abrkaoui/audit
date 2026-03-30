import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { ArrowLeft, CheckCircle, XCircle, Trash2, Calendar, User, FileImage, AlertTriangle, Download } from 'lucide-react';

function AuditDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef();

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await axios.get(`https://audit-mbfr.onrender.com/api/audits/${id}`);
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
        if (window.confirm("Are you sure you want to delete this audit report?")) {
            try {
                await axios.delete(`https://audit-mbfr.onrender.com/api/audits/${id}`);
                navigate('/');
            } catch (err) {
                console.error('Error deleting audit', err);
                alert('Failed to delete audit');
            }
        }
    };

    const handleDownloadPDF = () => {
        const element = reportRef.current;

        const opt = {
            margin: 15, // 15mm margin
            filename: `Audit_Report_${data.audit.site.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().from(element).set(opt).save();
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!data || !data.audit) return <div className="text-center py-12 text-gray-500 font-bold text-xl">Audit not found</div>;

    const { audit, stats, grouped } = data;
    const issues = audit.checklistResponses.filter(r => !r.value);

    return (
        <div className="max-w-5xl mx-auto pb-24">

            {/* Top action bar - Hidden in Print */}
            <div className="flex items-center justify-between mb-8 print:hidden">
                <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition-colors font-semibold">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
                </Link>
                <div className="flex space-x-4">
                    <button onClick={handleDownloadPDF} className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer">
                        <Download className="w-5 h-5 mr-2" /> Download Professional PDF
                    </button>
                    <button onClick={handleDelete} className="flex items-center text-red-500 hover:text-red-700 font-bold px-5 py-2.5 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors shadow-sm cursor-pointer">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </button>
                </div>
            </div>

            {/* --- START OF PDF CONTAINER --- */}
            <div ref={reportRef} className="bg-white rounded-xl shadow-lg border border-gray-200 p-10 text-gray-800 font-sans mx-auto text-[14px]">

                {/* --- 1. HEADER (Horizontal Layout) --- */}
                <div className="flex flex-row justify-between items-start border-b-2 border-gray-200 pb-8 mb-8" style={{ pageBreakInside: 'avoid' }}>

                    {/* LEFT SIDE: Image + Info */}
                    <div className="flex flex-row items-center gap-6">
                        {audit.siteImage ? (
                            <img src={`https://audit-mbfr.onrender.com${audit.siteImage}`} alt="Site Front" className="w-32 h-32 object-cover rounded-2xl shadow-sm border border-gray-200" crossOrigin="anonymous" />
                        ) : (
                            <div className="w-32 h-32 bg-gray-50 rounded-2xl border flex flex-col items-center justify-center text-gray-300 shadow-inner">
                                <FileImage className="w-10 h-10 mb-1 opacity-50" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">NO IMAGE</span>
                            </div>
                        )}

                        <div className="flex flex-col justify-center">
                            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Audit Report</h1>
                            <h2 className="text-2xl font-bold text-gray-600 mb-4">{audit.site}</h2>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                <div>
                                    <span className="text-gray-400 font-bold uppercase text-[11px] tracking-widest block mb-0.5">Date</span>
                                    <p className="font-bold text-gray-800 flex items-center text-sm"><Calendar className="w-4 h-4 mr-1.5 text-blue-500" /> {new Date(audit.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold uppercase text-[11px] tracking-widest block mb-0.5">Performed By</span>
                                    <p className="font-bold text-gray-800 flex items-center text-sm"><User className="w-4 h-4 mr-1.5 text-blue-500" /> {audit.performedBy || 'System Auditor'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Score & Stats */}
                    <div className="flex flex-col items-end text-right">
                        <div className={`flex flex-col items-center justify-center px-8 py-5 rounded-2xl border-2 ${stats.percentage >= 90 ? 'bg-green-50 border-green-200 text-green-700' : stats.percentage >= 70 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <span className="text-xs font-black uppercase tracking-widest mb-1 opacity-80">Global Score</span>
                            <span className="text-6xl font-black leading-none">{stats.percentage}%</span>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${stats.percentage >= 70 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                {stats.percentage >= 70 ? 'Terminé (Conform)' : 'Terminé (Action Required)'}
                            </span>

                            <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> {stats.issuesCount} Issues
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- 2. ÉLÉMENTS SIGNALÉS --- */}
                {issues.length > 0 && (
                    <div className="mb-12" style={{ pageBreakInside: 'avoid' }}>
                        <h3 className="text-xl font-black text-red-800 mb-6 flex items-center">
                            <span className="bg-red-600 w-2 h-6 mr-3 rounded-full"></span>
                            Éléments Signalés ({stats.issuesCount})
                        </h3>

                        <div className="space-y-4">
                            {issues.map((issue, idx) => (
                                <div key={idx} className="flex flex-row justify-between items-center bg-red-50/50 border border-red-100 rounded-xl p-5 shadow-sm" style={{ pageBreakInside: 'avoid' }}>
                                    {/* Left side text */}
                                    <div className="flex-1 pr-6 border-l-4 border-red-500 pl-4 py-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">
                                            {issue.category} &rsaquo; {issue.subcategory} &rsaquo; {issue.section}
                                        </p>
                                        <h4 className="text-lg font-bold text-gray-900 mb-3">{issue.label}</h4>

                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-black bg-red-100 text-red-700 border border-red-200">
                                                <XCircle className="w-3.5 h-3.5 mr-1" /> NON
                                            </span>
                                            {issue.comment && (
                                                <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-md border border-gray-200 italic shadow-sm">
                                                    " {issue.comment} "
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right side image */}
                                    {issue.photoUrl && (
                                        <div className="shrink-0 w-36 h-28 ml-4">
                                            <img src={`https://audit-mbfr.onrender.com${issue.photoUrl}`} alt="Issue Proof" crossOrigin="anonymous" className="w-full h-full object-cover rounded-lg shadow-sm border border-gray-200" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PAGE BREAK BEFORE DETAILED REPORT */}
                <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always' }}></div>

                {/* --- 3. DETAILED REPORT SECTION --- */}
                <div className="mt-8">
                    <h3 className="text-2xl font-black text-gray-900 mb-8 pb-3 flex items-center border-b-2 border-gray-200">
                        <span className="bg-gray-800 w-2 h-7 mr-3 rounded-full"></span>
                        Detailed Audit Breakdown
                    </h3>

                    <div className="space-y-16">
                        {Object.keys(grouped).map(catKey => {
                            const cat = grouped[catKey];
                            return (
                                <div key={catKey} className="space-y-8" style={{ pageBreakInside: 'auto' }}>
                                    {/* CATEGORY */}
                                    <div className="flex justify-between items-end border-b-2 border-gray-800 pb-2 mb-6" style={{ pageBreakInside: 'avoid' }}>
                                        <h4 className="text-2xl font-black uppercase tracking-wider text-gray-900">{catKey}</h4>
                                        <span className={`font-black text-xl px-4 py-1.5 rounded-lg border-2 ${cat.percentage >= 90 ? 'bg-green-50 text-green-700 border-green-200' : cat.percentage >= 70 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {cat.percentage}%
                                        </span>
                                    </div>

                                    {/* SUBCATEGORY */}
                                    <div className="space-y-10 pl-2">
                                        {Object.keys(cat.subcategories).map(subKey => {
                                            const sub = cat.subcategories[subKey];
                                            return (
                                                <div key={subKey} className="mb-8" style={{ pageBreakInside: 'auto' }}>
                                                    <h5 className="text-lg font-black text-gray-800 mb-6 flex justify-between items-center bg-gray-100 px-5 py-3 rounded-lg border border-gray-200" style={{ pageBreakInside: 'avoid' }}>
                                                        <span>{subKey}</span>
                                                        <span className="text-blue-600 font-black">{sub.percentage}%</span>
                                                    </h5>

                                                    <div className="pl-4 space-y-8">
                                                        {Object.keys(sub.sections).map(secKey => {
                                                            const sec = sub.sections[secKey];
                                                            return (
                                                                <div key={secKey} style={{ pageBreakInside: 'avoid' }}>
                                                                    <h6 className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1 flex justify-between items-center">
                                                                        <span>{secKey}</span>
                                                                        <span className="text-gray-400 font-bold">{sec.percentage}%</span>
                                                                    </h6>

                                                                    {/* CHECKLIST ROWS */}
                                                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-sm">
                                                                        {sec.items.map((item, idx) => (
                                                                            <div key={idx} className="flex flex-row justify-between items-center p-4">
                                                                                {/* Left side */}
                                                                                <div className="flex-1 pr-6 flex flex-col justify-center">
                                                                                    <p className={`font-bold text-[15px] ${item.value ? 'text-gray-800' : 'text-red-700'}`}>{item.label}</p>
                                                                                    {item.comment && <p className="text-[13px] font-semibold italic text-gray-500 mt-1">Note: {item.comment}</p>}
                                                                                    {item.photoUrl && (
                                                                                        <div className="mt-2 text-left">
                                                                                            <img src={`https://audit-mbfr.onrender.com${item.photoUrl}`} className="h-20 w-32 object-cover rounded-lg shadow-sm border border-gray-200" crossOrigin="anonymous" alt="attachment" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Right side alignment (fixed width column) */}
                                                                                <div className="w-24 text-right flex justify-end shrink-0">
                                                                                    {item.value ? (
                                                                                        <span className="inline-flex items-center justify-center px-4 py-1.5 bg-green-50 text-green-700 font-black text-sm rounded-lg min-w-[70px] border border-green-200 shadow-sm"><CheckCircle className="w-3.5 h-3.5 inline mr-1" />OUI</span>
                                                                                    ) : (
                                                                                        <span className="inline-flex items-center justify-center px-4 py-1.5 bg-red-50 text-red-700 font-black text-sm rounded-lg min-w-[70px] border border-red-200 shadow-sm"><XCircle className="w-3.5 h-3.5 inline mr-1" />NON</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

        </div>
    );
}

export default AuditDetails;