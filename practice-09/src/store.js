import { selectTasks, findTask } from "./task-service.js";

export function createStore(seed) {
  const categories = seed.categories.map((item) => ({ ...item }));
  const tasks = seed.tasks.map((item) => ({ ...item }));

  return {
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
