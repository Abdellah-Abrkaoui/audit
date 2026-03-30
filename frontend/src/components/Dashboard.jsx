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
import { FileText, TrendingUp, CheckCircle, AlertTriangle, Printer } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard() {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/audits');
                setAudits(res.data);
            } catch (err) {
                console.error('Error fetching audits', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudits();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    const totalAudits = audits.length;
    let totalYes = 0;
    let totalNo = 0;
    let subcategoryScores = {};

    audits.forEach(audit => {
        audit.checklistResponses.forEach(res => {
            if (res.value) totalYes++;
            else totalNo++;

            if (res.subcategory) {
                if (!subcategoryScores[res.subcategory]) subcategoryScores[res.subcategory] = { yes: 0, total: 0 };
                subcategoryScores[res.subcategory].total++;
                if (res.value) subcategoryScores[res.subcategory].yes++;
            }
        });
    });

    const averageScore = totalYes + totalNo > 0 ? Math.round((totalYes / (totalYes + totalNo)) * 100) : 0;

    const pieData = {
        labels: ['Yes (Compliant)', 'No (Issues)'],
        datasets: [{
            data: [totalYes, totalNo],
            backgroundColor: ['#10B981', '#EF4444'],
            hoverBackgroundColor: ['#059669', '#DC2626'],
            borderWidth: 0,
        }],
    };

    const barLabels = Object.keys(subcategoryScores);
    const barDataValues = barLabels.map(sub =>
        Math.round((subcategoryScores[sub].yes / subcategoryScores[sub].total) * 100)
    );

    const barData = {
        labels: barLabels,
        datasets: [{
            label: 'Compliance Score (%)',
            data: barDataValues,
            backgroundColor: '#3B82F6',
            borderRadius: 6,
        }],
    };

    const statCard = (title, value, icon, colorClass, suffix = "") => (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                    <h4 className="text-4xl font-black text-gray-900">{value}<span className="text-xl text-gray-400 ml-1 font-semibold">{suffix}</span></h4>
                </div>
                <div className={`p-4 rounded-xl ${colorClass}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-gray-900">Audit Overview</h1>
                <Link to="/new" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center">
                    Start New Professional Audit
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCard("Total Audits", totalAudits, <FileText className="w-8 h-8 text-blue-600" />, "bg-blue-50")}
                {statCard("Global Score", averageScore, <TrendingUp className="w-8 h-8 text-emerald-600" />, "bg-emerald-50", "%")}
                {statCard("Compliant Items", totalYes, <CheckCircle className="w-8 h-8 text-emerald-600" />, "bg-emerald-50")}
                {statCard("Total Issues", totalNo, <AlertTriangle className="w-8 h-8 text-red-600" />, "bg-red-50")}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
                    <h3 className="text-lg font-black text-gray-900 mb-6">Overall Compliance</h3>
                    <div className="h-64 flex justify-center">
                        {totalYes + totalNo > 0 ? <Pie data={pieData} options={{ maintainAspectRatio: false }} /> : <p className="text-gray-400 self-center font-semibold">No data yet</p>}
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-black text-gray-900 mb-6">Score by Subcategory</h3>
                    <div className="h-64">
                        {barLabels.length > 0 ? (
                            <Bar
                                data={barData}
                                options={{
                                    maintainAspectRatio: false,
                                    scales: { y: { beginAtZero: true, max: 100 } },
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        ) : <p className="text-gray-400 flex h-full items-center justify-center font-semibold">No data yet</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-black text-gray-900">Recent Audit Reports</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100">Site</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100">Auditor</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100">Score</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-gray-100">Report</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {audits.slice(0, 10).map(audit => {
                                const y = audit.checklistResponses.filter(r => r.value).length;
                                const total = audit.checklistResponses.length;
                                const score = total > 0 ? Math.round((y / total) * 100) : 0;

                                return (
                                    <tr key={audit._id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            <div className="flex items-center">
                                                {audit.siteImage ? (
                                                    <img src={`http://localhost:5000${audit.siteImage}`} className="w-8 h-8 rounded-md object-cover mr-3 border" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-md bg-gray-100 mr-3 flex items-center justify-center text-gray-400 border"><FileText className="w-4 h-4" /></div>
                                                )}
                                                <div>
                                                    {audit.site}
                                                    <div className="text-xs font-medium text-gray-500 mt-0.5">{audit.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">{audit.performedBy || 'System'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-500">{new Date(audit.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`text-md font-black ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
                                                    {score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                            <Link to={`/audit/${audit._id}`} className="text-blue-600 hover:text-blue-800 flex items-center justify-end">
                                                View PDF <Printer className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100" />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                            {audits.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-gray-500 font-semibold text-lg">No audits found. Create a new professional report.</td>
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
