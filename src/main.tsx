import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { DataProvider } from './store/DataContext';
import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Personal from './pages/Personal';
import Business from './pages/Business';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AppCalendar from './pages/Calendar';
import AdminProfile from './pages/admin/AdminProfile';
import ClientLogin from './pages/client/ClientLogin';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientProjects from './pages/client/ClientProjects';
import ClientProjectDetail from './pages/client/ClientProjectDetail';
import ClientPayments from './pages/client/ClientPayments';
import ClientDocuments from './pages/client/ClientDocuments';
import ClientAbout from './pages/client/ClientAbout';
import ClientTerms from './pages/client/ClientTerms';
import ClientCalendar from './pages/client/ClientCalendar';
import ClientProfile from './pages/client/ClientProfile';
import { ClientGuard } from './components/ClientGuard';
import ClientLayout from './components/ClientLayout';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/admin-730If1Q5/login" element={<Login />} />
          <Route path="/admin-730If1Q5" element={<AuthGuard />}>
            <Route element={<DataProvider> <Layout /> </DataProvider>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="personal" element={<Personal />} />
              <Route path="business" element={<Business />} />
              <Route path="projects" element={<Projects />} />
              <Route path="calendar" element={<AppCalendar />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="project/:id" element={<ProjectDetail />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route element={<ClientGuard />}>
            <Route element={<ClientLayout />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/projects" element={<ClientProjects />} />
              <Route path="/client/projects/:id" element={<ClientProjectDetail />} />
              <Route path="/client/payments" element={<ClientPayments />} />
              <Route path="/client/documents" element={<ClientDocuments />} />
              <Route path="/client/about" element={<ClientAbout />} />
              <Route path="/client/terms" element={<ClientTerms />} />
              <Route path="/client/calendar" element={<ClientCalendar />} />
              <Route path="/client/profile" element={<ClientProfile />} />
              <Route path="/client/*" element={<Navigate to="/client/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
