import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TRPCProvider } from './shared/providers/trpc';
import { ErrorBoundary } from './shared/ErrorBoundary';

const AgencyLanding = lazy(() => import('./pages/AgencyLanding'));
const ProspectLanding = lazy(() => import('./pages/ProspectLanding'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="font-mono text-xs text-white/50 uppercase tracking-widest animate-pulse">
        Loading...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TRPCProvider>
      <Router>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Admin dashboard */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Personalized prospect landing pages */}
              <Route path="/p/:slug" element={<ProspectLanding />} />

              {/* Root: Agency Main Landing Page */}
              <Route path="/" element={<AgencyLanding />} />

              {/* Catch-all */}
              <Route path="*" element={<AgencyLanding />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </TRPCProvider>
  );
}


