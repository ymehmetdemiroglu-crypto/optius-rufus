import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TRPCProvider } from './providers/trpc';
import ProspectLanding from './pages/ProspectLanding';
import InvitationOnly from './pages/InvitationOnly';

export default function App() {
  return (
    <TRPCProvider>
      <Router>
        <Routes>
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
