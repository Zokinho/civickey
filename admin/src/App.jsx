import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import Facilities from './pages/Facilities';
import Schedule from './pages/Schedule';
import RoadClosures from './pages/RoadClosures';
import AdminManagement from './pages/AdminManagement';
import MunicipalityManagement from './pages/MunicipalityManagement';
import WebsiteSettings from './pages/WebsiteSettings';
import CustomPages from './pages/CustomPages';
import CustomPageEditor from './pages/CustomPageEditor';
import WasteItems from './pages/WasteItems';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="events" element={<Events />} />
              <Route path="facilities" element={<Facilities />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="waste-items" element={<WasteItems />} />
              <Route path="road-closures" element={<RoadClosures />} />
              <Route path="website-settings" element={<WebsiteSettings />} />
              <Route path="custom-pages" element={<CustomPages />} />
              <Route path="custom-pages/:pageId" element={<CustomPageEditor />} />
              <Route path="admins" element={<AdminManagement />} />
              <Route path="municipalities" element={<MunicipalityManagement />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
