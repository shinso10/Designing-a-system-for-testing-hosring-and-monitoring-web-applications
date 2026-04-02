const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/monitoring';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_to_secure_secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ error: 'Токен авторизации отсутствует' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
    req.user = payload;
    next();
  });
};

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected');
    await seedApps();
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateUsername = (value) => typeof value === 'string' && value.trim().length >= 3;
const validateEmail = (value) => typeof value === 'string' && emailRegex.test(value.trim().toLowerCase());
const validatePassword = (value) => typeof value === 'string' && value.length >= 6;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, unique: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const appSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  status: { type: String, required: true, enum: ['Online', 'Warning', 'Offline'] },
  uptime: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    },
  },
});

const User = mongoose.model('User', userSchema);
const MonitoredApp = mongoose.model('MonitoredApp', appSchema);

const seedApps = async () => {
  const count = await MonitoredApp.countDocuments();
  if (count === 0) {
    await MonitoredApp.create([
      { name: 'Main E-commerce', status: 'Online', uptime: '99.9%', description: 'Основной магазин' },
      { name: 'Payment Gateway', status: 'Warning', uptime: '98.5%', description: 'Платежный сервис' },
    ]);
    console.log('Seeded initial application data');
  }
};

const findUserByLogin = async (login) => {
  const normalized = login.trim().toLowerCase();
  return User.findOne({ $or: [{ username: login.trim() }, { email: normalized }] });
};

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Поля username, email и password обязательны' });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ error: 'Имя пользователя должно быть минимум 3 символа' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Неверный формат email' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ $or: [{ username: username.trim() }, { email: normalizedEmail }] });
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким именем или email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await User.create({ username: username.trim(), email: normalizedEmail, password: hashedPassword });
    const token = jwt.sign({ id: createdUser._id.toString(), username: createdUser.username, email: createdUser.email }, JWT_SECRET, { expiresIn: '8h' });
    res.status(201).json({
      message: 'Пользователь зарегистрирован',
      token,
      user: { username: createdUser.username, email: createdUser.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Поля login и password обязательны' });
    }

    const user = await findUserByLogin(login);
    if (!user) {
      return res.status(401).json({ error: 'Неправильные учетные данные' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неправильные учетные данные' });
    }

    const token = jwt.sign({ id: user._id.toString(), username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.status(200).json({ message: 'Вход выполнен', token, user: { username: user.username, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.get('/api/apps', authenticateToken, async (req, res) => {
  try {
    const apps = await MonitoredApp.find();
    res.status(200).json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка приложений' });
  }
});

app.get('/api/apps/:id', authenticateToken, async (req, res) => {
  try {
    const appData = await MonitoredApp.findById(req.params.id);
    if (!appData) {
      return res.status(404).json({ error: 'Приложение не найдено' });
    }
    res.status(200).json(appData);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения приложения' });
  }
});

app.post('/api/apps', authenticateToken, async (req, res) => {
  try {
    const { name, status, uptime, description } = req.body;
    if (!name || !status || !uptime) {
      return res.status(400).json({ error: 'Не все обязательные поля переданы' });
    }

    const newApp = await MonitoredApp.create({ name, status, uptime, description: description || '' });
    res.status(201).json(newApp);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания записи' });
  }
});

app.put('/api/apps/:id', authenticateToken, async (req, res) => {
  try {
    const { name, status, uptime, description } = req.body;
    const updatedApp = await MonitoredApp.findByIdAndUpdate(
      req.params.id,
      { name, status, uptime, description },
      { new: true, runValidators: true }
    );

    if (!updatedApp) {
      return res.status(404).json({ error: 'Приложение не найдено' });
    }

    res.status(200).json(updatedApp);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления приложения' });
  }
});

app.delete('/api/apps/:id', authenticateToken, async (req, res) => {
  try {
    const deletedApp = await MonitoredApp.findByIdAndDelete(req.params.id);
    if (!deletedApp) {
      return res.status(404).json({ error: 'Приложение не найдено' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления приложения' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint не найден' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
