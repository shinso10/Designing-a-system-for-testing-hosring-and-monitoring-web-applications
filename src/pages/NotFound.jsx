import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <section className="dashboard">
    <h2>Страница не найдена</h2>
    <p>Возможно, ссылка устарела или вы ввели неверный адрес.</p>
    <Link to="/" style={{ color: '#38bdf8' }}>Вернуться на главную</Link>
  </section>
);

export default NotFound;
