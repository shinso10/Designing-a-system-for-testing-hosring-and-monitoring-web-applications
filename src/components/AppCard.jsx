import React from 'react';

const AppCard = ({ appData, onDelete }) => {
  const statusClass = appData.status === 'Online'
    ? 'status-online'
    : appData.status === 'Warning'
      ? 'status-warning'
      : 'status-offline';

  return (
    <article className="app-card">
      <h3>{appData.name}</h3>
      <p className={statusClass}>Статус: {appData.status}</p>
      <p>Uptime: {appData.uptime}</p>
      <p>{appData.description}</p>
      <div className="form-grid">
        <button type="button" onClick={() => alert(`Запуск теста: ${appData.name}`)}>
          Тестировать
        </button>
        {onDelete && (
          <button type="button" style={{ background: '#f97316', color: '#fff' }} onClick={() => onDelete(appData.id)}>
            Удалить
          </button>
        )}
      </div>
    </article>
  );
};

export default AppCard;
