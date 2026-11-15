import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminForm from './components/AdminForm';
import AuditDetails from './components/AuditDetails';
import ConfigPanel from './components/ConfigPanel';
import { LayoutDashboard, FilePlus2, Settings, ShieldCheck, Plus } from 'lucide-react';

function Navbar() {
    const navLinkClass = ({ isActive }) =>
        `flex items-center px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
            isActive
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
        }`;

    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 print:hidden transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xl font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                                    QC Audit
                                </span>
                                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                                    Store Pro
                                </span>
                            </div>
                        </Link>

                        {/* Nav Items */}
                        <nav className="flex space-x-1 sm:space-x-2 items-center">
                            <NavLink to="/" className={navLinkClass}>
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                <span>Dashboard</span>
                            </NavLink>
                            <NavLink to="/new" className={navLinkClass}>
                                <FilePlus2 className="w-4 h-4 mr-2" />
                                <span>New Audit</span>
                            </NavLink>
                            <NavLink to="/config" className={navLinkClass}>
                                <Settings className="w-4 h-4 mr-2" />
                                <span>Config Panel</span>
                            </NavLink>
                        </nav>
                    </div>

                    {/* Right side live status & fast CTA */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Connecté</span>
                        </div>

                        <Link
                            to="/new"
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Lancer un Audit</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col font-sans bg-gray-50/70 text-gray-900">
                <Navbar />

                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full print:p-0 print:m-0 print:max-w-full">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/new" element={<AdminForm />} />
                        <Route path="/audit/:id" element={<AuditDetails />} />
                        <Route path="/config" element={<ConfigPanel />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
