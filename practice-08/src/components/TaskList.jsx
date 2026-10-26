import TaskItem from "./TaskItem.jsx";

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete, interactionsDisabled }) {
  return (
    <section className="panel" aria-labelledby="list-heading">
      <h2 id="list-heading">Найденные задачи</h2>
      <p className="filters-hint">Найдено: {tasks.length}</p>
      {tasks.length === 0 ? (
        <p className="empty-message">Нет задач по выбранному фильтру.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={
                categories.find((item) => item.id === task.categoryId)?.name ?? `Категория ${task.categoryId}`
              }
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              disabled={interactionsDisabled}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
