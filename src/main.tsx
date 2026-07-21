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
import AppCalendar from './pages/Calendar';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGuard />}>
            <Route element={<DataProvider> <Layout /> </DataProvider>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/business" element={<Business />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/calendar" element={<AppCalendar />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
