import { useMemo, useState } from "react";
import { api } from "./config.js";
import { createInitialFilters, EMPTY_FILTERS, variantNumber } from "./variant.js";
import { useTaskData } from "./hooks/useTaskData.js";
import { useLastUpdated } from "./hooks/useLastUpdated.js";
import TaskForm from "./components/TaskForm.jsx";
import TaskFilters from "./components/TaskFilters.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskStats from "./components/TaskStats.jsx";
import StatusMessage from "./components/StatusMessage.jsx";

function buildStats(tasks, total) {
  const completed = tasks.filter((task) => task.completed).length;

  return {
    total,
    completed,
    active: tasks.length - completed,
  };
}

export default function App() {
  const [filters, setFilters] = useState(() => createInitialFilters(variantNumber));
  const [editingTask, setEditingTask] = useState(null);

  const {
    snapshot,
    status,
    error,
    mutationError,
    pending,
    refresh,
    saveTask,
    toggleTask,
    deleteTask,
    resetData,
  } = useTaskData({ api, filters });

  const lastUpdated = useLastUpdated(snapshot, status);
  const interactionsDisabled = status !== "ready" || pending;

  const stats = useMemo(
    () => buildStats(snapshot.tasks, snapshot.meta.total ?? snapshot.tasks.length),
    [snapshot.tasks, snapshot.meta.total]
  );

  const loadErrorMessage = error instanceof Error ? error.message : error ? String(error) : "";

  async function handleSave(value) {
    const saved = await saveTask(editingTask?.id ?? null, value);

    if (saved && editingTask !== null) {
      setEditingTask(null);
    }

    return saved;
  }

  function handleEdit(task) {
    setEditingTask({ ...task });
  }

  async function handleToggle(task) {
    await toggleTask(task);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(`Удалить задачу ${id}?`);

    if (!confirmed) {
      return;
    }

    const removed = await deleteTask(id);

    if (removed && editingTask?.id === id) {
      setEditingTask(null);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Задачи на React и API</h1>
        <p className="storage-message">
          Вариант {variantNumber}. Данные загружаются с учебного сервера по адресу из VITE_API_URL.
        </p>
        {lastUpdated ? <p className="storage-message">Последнее успешное обновление: {lastUpdated}</p> : null}
        <div className="form-actions">
          <button type="button" onClick={refresh}>
            Обновить список
          </button>
          <button type="button" disabled={interactionsDisabled} onClick={() => void resetData()}>
            Восстановить демо-набор
          </button>
        </div>
        {status === "loading" ? <StatusMessage kind="status">Загрузка…</StatusMessage> : null}
        <StatusMessage kind="error">{loadErrorMessage}</StatusMessage>
      </header>
      <main className="page-main">
        <TaskStats stats={stats} />
        <TaskForm
          key={editingTask?.id ?? "new"}
          categories={snapshot.categories}
          initialTask={editingTask}
          onSave={handleSave}
          onCancel={() => setEditingTask(null)}
          pending={interactionsDisabled}
          mutationError={mutationError}
        />
        <TaskFilters
          filters={filters}
          categories={snapshot.categories}
          onChange={setFilters}
          emptyFilters={EMPTY_FILTERS}
        />
        <TaskList
          tasks={snapshot.tasks}
          categories={snapshot.categories}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          interactionsDisabled={interactionsDisabled}
        />
      </main>
    </>
  );
}
