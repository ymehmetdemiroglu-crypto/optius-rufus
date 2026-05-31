import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TRPCProvider } from './providers/trpc';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Workspace from './pages/Workspace';
import Competitors from './pages/Competitors';
import Settings from './pages/Settings';

function AppContent() {
  return (
    <div className="flex min-h-screen bg-brand-bg text-slate-200">
      {/* Premium Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Workspace Frame */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/workspace/:asin" element={<Workspace />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TRPCProvider>
      <Router>
        <AppContent />
      </Router>
    </TRPCProvider>
  );
}
