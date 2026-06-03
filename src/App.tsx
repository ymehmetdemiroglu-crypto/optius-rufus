import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TRPCProvider } from './providers/trpc';
import ProspectLanding from './pages/ProspectLanding';

export default function App() {
  return (
    <TRPCProvider>
      <Router>
        <Routes>
          {/* Personalized prospect landing pages */}
          <Route path="/p/:slug" element={<ProspectLanding />} />

          {/* Root: Redirect to mock-prospect */}
          <Route path="/" element={<Navigate to="/p/mock-prospect" replace />} />

          {/* Catch-all: redirect to mock-prospect */}
          <Route path="*" element={<Navigate to="/p/mock-prospect" replace />} />
        </Routes>
      </Router>
    </TRPCProvider>
  );
}
