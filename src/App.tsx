import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import ProfilePage from './pages/ProfilePage';
import TemplatesPage from './pages/TemplatesPage';
import ResourcesPage from './pages/ResourcesPage';
import SettingsPage from './pages/SettingsPage';
import HireProPage from './pages/HireProPage';
import SupportPage from './pages/SupportPage';
import ProjectDocuments from './pages/ProjectDocuments';
import { PaymentProvider } from './contexts/PaymentContext';

function App() {
  return (
    <Router>
      <PaymentProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="new-project" element={<NewProject />} />
            <Route path="projects/:id/documents" element={<ProjectDocuments />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="hire-pro" element={<HireProPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </PaymentProvider>
    </Router>
  );
}

export default App