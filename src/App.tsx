import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TRPCProvider } from './providers/trpc';
import ProspectLanding from './pages/ProspectLanding';
import InvitationOnly from './pages/InvitationOnly';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <TRPCProvider>
      <Router>
        <Routes>
          {/* Admin dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Personalized prospect landing pages */}
          <Route path="/p/:slug" element={<ProspectLanding />} />

          {/* Root: Invitation-only landing */}
          <Route path="/" element={<InvitationOnly />} />

          {/* Catch-all: show invitation page */}
          <Route path="*" element={<InvitationOnly />} />
        </Routes>
      </Router>
    </TRPCProvider>
  );
}

