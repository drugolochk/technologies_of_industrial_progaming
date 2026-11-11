import { selectTasks, findTask } from "./task-service.js";

export function createStore(seed) {
  const categories = seed.categories.map((item) => ({ ...item }));
  const tasks = seed.tasks.map((item) => ({ ...item }));

  return {
    addTask(value) {
      const id = Math.max(0, ...tasks.map((task) => task.id)) + 1;
      const task = { id, ...value, completed: false };
      tasks.push(task);
      return task;
    },

    listCategories() {
      return categories;
    },

    listTasks(filters) {
      return selectTasks(tasks, filters);
    },

    getTask(id) {
      return findTask(tasks, id);
    },
  };
}
