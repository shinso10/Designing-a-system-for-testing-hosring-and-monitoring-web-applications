const API_BASE = process.env.API_URL || 'http://localhost:5000';

const checkResponse = async (response, name) => {
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${name} failed (${response.status}): ${body}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const run = async () => {
  if (typeof fetch === 'undefined') {
    throw new Error('Требуется Node.js 18+ для запуска этого теста (fetch доступен глобально).');
  }

  const timestamp = Date.now();
  const user = {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@example.com`,
    password: 'Test1234!',
  };

  console.log('1) Регистрируем пользователя...');
  const registerRes = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  const registerData = await checkResponse(registerRes, 'Register');
  console.log('   Пользователь зарегистрирован, токен получен.');

  console.log('2) Авторизуемся...');
  const loginRes = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: user.email, password: user.password }),
  });
  const loginData = await checkResponse(loginRes, 'Login');
  const token = loginData.token;
  console.log(`   Вход выполнен, токен: ${token ? 'получен' : 'отсутствует'}`);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log('3) Получаем список приложений...');
  const appsRes = await fetch(`${API_BASE}/api/apps`, { headers: authHeaders });
  const apps = await checkResponse(appsRes, 'Get Apps');
  console.log(`   Получено приложений: ${Array.isArray(apps) ? apps.length : 0}`);

  console.log('4) Создаем новое приложение...');
  const newApp = {
    name: `test-app-${timestamp}`,
    status: 'Online',
    uptime: '100%',
    description: 'Тестовое приложение для API проверки',
  };
  const createRes = await fetch(`${API_BASE}/api/apps`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(newApp),
  });
  const createdApp = await checkResponse(createRes, 'Create App');
  console.log(`   Приложение создано с id = ${createdApp.id || createdApp._id}`);

  const appId = createdApp.id || createdApp._id;
  if (!appId) {
    throw new Error('Не удалось получить id созданного приложения');
  }

  console.log('5) Обновляем приложение...');
  const updateRes = await fetch(`${API_BASE}/api/apps/${appId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ ...newApp, status: 'Warning', uptime: '99.5%' }),
  });
  const updatedApp = await checkResponse(updateRes, 'Update App');
  console.log(`   Статус после обновления: ${updatedApp.status}`);

  console.log('6) Удаляем приложение...');
  const deleteRes = await fetch(`${API_BASE}/api/apps/${appId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (deleteRes.status !== 204) {
    const body = await deleteRes.text();
    throw new Error(`Delete App failed (${deleteRes.status}): ${body}`);
  }
  console.log('   Приложение успешно удалено.');

  console.log('\nAPI тест успешно пройден!');
};

run().catch((error) => {
  console.error('API тест завершился с ошибкой:');
  console.error(error.message || error);
  process.exit(1);
});
