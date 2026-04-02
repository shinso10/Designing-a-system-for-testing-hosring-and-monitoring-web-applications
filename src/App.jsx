import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = Boolean(localStorage.getItem('monitoringToken'));
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <header>
          <div>
            <h1>Система тестирования и мониторинга</h1>
            <p>Контроль развернутых веб-приложений и безопасность доступа</p>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer>
          <p>© 2026 Система мониторинга веб-приложений</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
