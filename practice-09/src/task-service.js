const LOCALE = "ru-RU";

export function selectTasks(tasks, filters) {
  const completed = filters.completed ?? null;
  const priority = filters.priority ?? null;
  const categoryId = filters.categoryId ?? null;
  const q = filters.q ?? "";
  const needle = q.trim().toLocaleLowerCase(LOCALE);

  return tasks.filter((task) => {
    if (completed !== null && task.completed !== completed) {
      return false;
    }

    if (priority !== null && task.priority !== priority) {
      return false;
    }

    if (categoryId !== null && task.categoryId !== categoryId) {
      return false;
    }

    if (needle !== "" && !task.title.toLocaleLowerCase(LOCALE).includes(needle)) {
      return false;
    }

    return true;
  });
}

export function findTask(tasks, id) {
  const task = tasks.find((item) => item.id === id);
  return task ?? null;
}
