const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('monitoringToken');
const getHeaders = (json = true) => {
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const checkResponse = async (response) => {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || 'Серверная ошибка');
  }
  return json;
};

export const getApps = async () => {
  const response = await fetch(`${API_ROOT}/apps`, {
    headers: getHeaders(false),
  });
  return checkResponse(response);
};

export const createApp = async (appData) => {
  const response = await fetch(`${API_ROOT}/apps`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(appData),
  });
  return checkResponse(response);
};

export const deleteApp = async (id) => {
  const response = await fetch(`${API_ROOT}/apps/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });
  if (response.status === 204) return true;
  return checkResponse(response);
};

export const registerUser = async (credentials) => {
  const response = await fetch(`${API_ROOT}/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  return checkResponse(response);
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_ROOT}/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  return checkResponse(response);
};
