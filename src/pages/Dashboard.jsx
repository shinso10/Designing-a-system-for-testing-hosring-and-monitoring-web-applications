import React, { useEffect, useState } from 'react';
import AppCard from '../components/AppCard';
import { getApps, createApp, deleteApp } from '../services/api';

const STATUS_OPTIONS = ['Online', 'Warning', 'Offline'];

const Dashboard = () => {
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', status: 'Online', uptime: '100%', description: '' });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      const data = await getApps();
      setApps(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const newApp = await createApp(form);
      setApps((prev) => [newApp, ...prev]);
      setSuccessMessage('Новое приложение добавлено в мониторинг.');
      setForm({ name: '', status: 'Online', uptime: '100%', description: '' });
    } catch (err) {
      setError(err.message || 'Ошибка при добавлении приложения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteApp(id);
      setApps((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Ошибка при удалении приложения');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('monitoringUser');
    localStorage.removeItem('monitoringToken');
    window.location.href = '/login';
  };

  if (isLoading) return <div className="loader">Загрузка данных мониторинга...</div>;
  if (error) return <div className="error-message">Ошибка: {error}</div>;

  return (
    <section className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <h2>Статус размещенных приложений</h2>
        <button onClick={handleLogout} style={{ background: '#f97316', color: '#fff' }}>Выйти</button>
      </div>

      <form onSubmit={handleSubmit} className="form-card" style={{ marginBottom: '1.5rem' }}>
        <h3>Добавить приложение</h3>
        <div className="form-grid">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Название приложения"
            required
          />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            value={form.uptime}
            onChange={(e) => setForm({ ...form, uptime: e.target.value })}
            placeholder="Uptime"
            required
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание (необязательно)"
            rows="3"
          />
        </div>
        <button type="submit">Добавить в мониторинг</button>
        {successMessage && <div className="success-message">{successMessage}</div>}
      </form>

      <div className="grid-container">
        {apps.map((app) => (
          <AppCard key={app.id} appData={app} onDelete={handleDelete} />
        ))}
      </div>
    </section>
  );
};

export default Dashboard;
