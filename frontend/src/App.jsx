import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminForm from './components/AdminForm';
import AuditDetails from './components/AuditDetails';
import ConfigPanel from './components/ConfigPanel';
import { LayoutDashboard, FilePlus2, Settings } from 'lucide-react';

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col font-sans transition-all duration-300">
                <header className="bg-white shadow-sm sticky top-0 z-50 print:hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <div className="flex-shrink-0 flex items-center">
                                    <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">QC Audit</span>
                                </div>
                                <nav className="ml-10 flex space-x-6 items-center">
                                    <Link
                                        to="/"
                                        className="group border-transparent text-gray-500 hover:text-blue-600 flex items-center px-1 pt-1 text-sm font-semibold transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4 mr-2 group-hover:text-blue-500 transition-colors" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/new"
                                        className="group border-transparent text-gray-500 hover:text-blue-600 flex items-center px-1 pt-1 text-sm font-semibold transition-colors"
                                    >
                                        <FilePlus2 className="w-4 h-4 mr-2 group-hover:text-blue-500 transition-colors" />
                                        New Audit
                                    </Link>
                                    <Link
                                        to="/config"
                                        className="group border-transparent text-gray-500 hover:text-blue-600 flex items-center px-1 pt-1 text-sm font-semibold transition-colors"
                                    >
                                        <Settings className="w-4 h-4 mr-2 group-hover:text-blue-500 transition-colors" />
                                        Config Panel
                                    </Link>
                                </nav>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full print:p-0 print:m-0 print:max-w-full">
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
