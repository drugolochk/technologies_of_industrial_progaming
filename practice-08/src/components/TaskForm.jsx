import { useState } from "react";
import { validateTaskDraft } from "../form-validation.js";
import StatusMessage from "./StatusMessage.jsx";

export default function TaskForm({
  categories,
  initialTask,
  onSave,
  onCancel,
  pending = false,
  mutationError = null,
}) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [priority, setPriority] = useState(initialTask?.priority ?? "medium");
  const [categoryId, setCategoryId] = useState(
    initialTask ? String(initialTask.categoryId) : String(categories[0]?.id ?? "")
  );
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const editing = initialTask !== null && initialTask !== undefined;
  const locked = pending || submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert("");

    const result = validateTaskDraft({ title, priority, categoryId }, categories);

    setErrors(result.errors);

    if (!result.valid) {
      setStatus("Исправьте отмеченные поля.");

      return;
    }

    if (locked) {
      return;
    }

    setSubmitting(true);

    try {
      const saved = await onSave(result.value);

      if (saved) {
        setStatus(editing ? "Изменения сохранены." : "Задача создана.");
        setTitle("");
        setPriority("medium");
        setCategoryId(String(categories[0]?.id ?? ""));
        setErrors({});
      } else {
        setAlert("Сохранение не выполнено. Проверьте сообщение об ошибке изменения.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const serverMessage =
    mutationError instanceof Error ? mutationError.message : mutationError ? String(mutationError) : "";

  return (
    <section className="panel" aria-labelledby="form-title">
      <h2 id="form-title">{editing ? `Редактирование задачи № ${initialTask.id}` : "Добавление задачи"}</h2>
      <form className="task-form" noValidate onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="field-title">Название</label>
          <input
            id="field-title"
            value={title}
            disabled={locked}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby="error-title"
          />
          <p id="error-title" className="field-error">
            {errors.title ?? ""}
          </p>
        </div>
        <div className="form-row">
          <label htmlFor="field-priority">Приоритет</label>
          <select
            id="field-priority"
            value={priority}
            disabled={locked}
            onChange={(event) => setPriority(event.target.value)}
            aria-invalid={Boolean(errors.priority)}
            aria-describedby="error-priority"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          <p id="error-priority" className="field-error">
            {errors.priority ?? ""}
          </p>
        </div>
        <div className="form-row">
          <label htmlFor="field-category">Категория</label>
          <select
            id="field-category"
            value={categoryId}
            disabled={locked}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby="error-categoryId"
          >
            {categories.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
          <p id="error-categoryId" className="field-error">
            {errors.categoryId ?? ""}
          </p>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={locked}>
            {editing ? "Сохранить изменения" : "Добавить задачу"}
          </button>
          {editing ? (
            <button type="button" disabled={locked} onClick={onCancel}>
              Отменить
            </button>
          ) : null}
        </div>
        <StatusMessage kind="success">{status}</StatusMessage>
        <StatusMessage kind="error">{alert}</StatusMessage>
        <StatusMessage kind="error">{serverMessage}</StatusMessage>
      </form>
    </section>
  );
}
