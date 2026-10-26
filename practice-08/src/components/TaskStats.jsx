export default function TaskStats({ stats }) {
  return (
    <section className="panel" aria-labelledby="stats-heading">
      <h2 id="stats-heading">Сводка по последней полученной выборке</h2>
      <dl className="task-summary">
        <div>
          <dt>В выборке</dt>
          <dd data-stat="total">{stats.total}</dd>
        </div>
        <div>
          <dt>Выполнено</dt>
          <dd data-stat="completed">{stats.completed}</dd>
        </div>
        <div>
          <dt>В работе</dt>
          <dd data-stat="active">{stats.active}</dd>
        </div>
      </dl>
    </section>
  );
}
