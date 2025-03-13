import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import ProjectDocuments from './pages/ProjectDocuments';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="new-project" element={<NewProject />} />
          <Route path="projects/:id/documents" element={<ProjectDocuments />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App