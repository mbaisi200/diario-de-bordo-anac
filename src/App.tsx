import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewFlight from './pages/NewFlight';
import FlightList from './pages/FlightList';
import FlightDetails from './pages/FlightDetails';
import PilotProfilePage from './pages/PilotProfile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-aviation-400 to-aviation-600 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-gradient-to-r from-aviation-500 to-aviation-600 p-5 rounded-2xl shadow-2xl">
              <svg className="animate-spin h-12 w-12 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-flight"
        element={
          <ProtectedRoute>
            <Layout><NewFlight /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/flights"
        element={
          <ProtectedRoute>
            <Layout><FlightList /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/flights/:id"
        element={
          <ProtectedRoute>
            <Layout><FlightDetails /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-flight/:id"
        element={
          <ProtectedRoute>
            <Layout><NewFlight /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout><PilotProfilePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
