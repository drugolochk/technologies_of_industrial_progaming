export const categories = Object.freeze([
  Object.freeze({ id: 1, name: "Учёба" }),
  Object.freeze({ id: 2, name: "Проект" }),
  Object.freeze({ id: 3, name: "Организация" }),
]);

export const tasks = Object.freeze(
  [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium", categoryId: 1 },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high", categoryId: 2 },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low", categoryId: 1 },
    { id: 10, title: "Оформить README", completed: true, priority: "medium", categoryId: 3 },
    { id: 13, title: "Изучить работу с DOM", completed: false, priority: "high", categoryId: 1 },
    { id: 16, title: "Проверить ответы API", completed: true, priority: "high", categoryId: 2 },
    { id: 19, title: "Составить план занятий", completed: false, priority: "medium", categoryId: 3 },
    { id: 22, title: "Подобрать примеры кода", completed: false, priority: "low", categoryId: 2 },
    { id: 25, title: "Настроить структуру проекта", completed: true, priority: "high", categoryId: 2 },
    { id: 28, title: "Описать контракт API", completed: false, priority: "medium", categoryId: 2 },
    { id: 31, title: "Собрать список источников", completed: true, priority: "low", categoryId: 3 },
    { id: 34, title: "Подготовить демонстрацию", completed: false, priority: "high", categoryId: 2 },
  ].map((task) => Object.freeze(task))
);
