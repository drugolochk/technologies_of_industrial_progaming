export default function TaskFilters({ filters, categories, onChange, emptyFilters }) {
  function update(name, value) {
    onChange({ ...filters, [name]: value });
  }

  return (
    <section className="panel" aria-labelledby="filters-heading">
      <h2 id="filters-heading">Фильтры</h2>
      <form
        className="task-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="form-row">
          <label htmlFor="filter-q">Поиск</label>
          <input id="filter-q" value={filters.q} onChange={(event) => update("q", event.target.value)} />
        </div>
        <div className="form-row">
          <span id="status-label">Статус</span>
          <div className="task-filters" role="group" aria-labelledby="status-label">
            {[
              ["", "Все"],
              ["false", "В работе"],
              ["true", "Завершенные"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filters.completed === value ? "is-active" : ""}
                aria-pressed={filters.completed === value}
                onClick={() => update("completed", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="filter-priority">Приоритет</label>
          <select
            id="filter-priority"
            value={filters.priority}
            onChange={(event) => update("priority", event.target.value)}
          >
            <option value="">Любой</option>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="filter-category">Категория</label>
          <select
            id="filter-category"
            value={filters.categoryId}
            onChange={(event) => update("categoryId", event.target.value)}
          >
            <option value="">Все категории</option>
            {categories.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="button" onClick={() => onChange({ ...emptyFilters })}>
            Сбросить фильтры
          </button>
        </div>
      </form>
    </section>
  );
}
