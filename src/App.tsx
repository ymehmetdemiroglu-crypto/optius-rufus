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

          {/* Root: Shows the prospect landing page directly for preview */}
          <Route path="/" element={<ProspectLanding />} />

          {/* Catch-all: redirect to root */}
          <Route path="*" element={<ProspectLanding />} />
        </Routes>
      </Router>
    </TRPCProvider>
  );
}
