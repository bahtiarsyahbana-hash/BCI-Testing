import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClaimList from './pages/ClaimList';
import ClaimDetail from './pages/ClaimDetail';
import NewClaim from './pages/NewClaim';
import Login from './pages/Login';
import Reports from './pages/Reports';
import AdminSettings from './pages/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="claims" element={<ClaimList />} />
          <Route path="claims/new" element={<NewClaim />} />
          <Route path="claims/:id" element={<ClaimDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
