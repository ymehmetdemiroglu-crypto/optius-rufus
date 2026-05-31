import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { TRPCProvider } from './providers/trpc';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Workspace from './pages/Workspace';
import Competitors from './pages/Competitors';
import Settings from './pages/Settings';
import ProspectLanding from './pages/ProspectLanding';
import ProspectDetail from './components/admin/ProspectDetail';
import Prospects from './pages/Prospects';

function AppContent() {
  const location = useLocation();
  const isPublicRoute = location.pathname.startsWith('/p/');

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/p/:slug" element={<ProspectLanding />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-slate-200">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto px-6 py-8 md:px-10">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/prospects" element={<Prospects />} />
          <Route path="/dashboard/prospects/:id" element={<ProspectDetail />} />
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
