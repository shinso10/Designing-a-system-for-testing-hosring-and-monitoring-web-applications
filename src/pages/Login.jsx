import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';

const Login = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ login: '', username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      if (mode === 'login') {
        const response = await loginUser({ login: form.login, password: form.password });
        localStorage.setItem('monitoringToken', response.token);
        localStorage.setItem('monitoringUser', response.user?.username || '');
        navigate('/');
      } else {
        const response = await registerUser({ username: form.username, email: form.email, password: form.password });
        localStorage.setItem('monitoringToken', response.token);
        localStorage.setItem('monitoringUser', response.user?.username || form.username || '');
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Ошибка авторизации');
    }
  };

  return (
    <section className="login-panel">
      <div className="login-card">
        <h2>{mode === 'login' ? 'Вход в систему' : 'Регистрация'}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          {mode === 'login' ? (
            <input
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              placeholder="Имя пользователя или email"
              required
            />
          ) : (
            <>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Имя пользователя"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                required
              />
            </>
          )}
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Пароль"
            required
          />
          <button type="submit">{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
              setSuccess(null);
            }}
            style={{ background: '#334155', color: '#fff' }}
          >
            {mode === 'login' ? 'Создать аккаунт' : 'Вернуться к входу'}
          </button>
        </form>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </section>
  );
};

export default Login;
