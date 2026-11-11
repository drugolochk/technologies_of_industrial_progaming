const PRIORITIES = ["low", "medium", "high"];
const TITLE_MAX = 100;

function positiveId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function validateTaskDraft(draft, categories) {
  const errors = {};

  if (draft === null || typeof draft !== "object" || Array.isArray(draft)) {
    return { valid: false, value: null, errors: { title: "Черновик должен быть объектом." } };
  }

  let title = "";

  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    title = draft.title.trim();

    if (title.length < 1 || title.length > TITLE_MAX) {
      errors.title = "Название должно содержать от 1 до 100 символов.";
    }
  }

  if (!PRIORITIES.includes(draft.priority)) {
    errors.priority = "Выберите приоритет: low, medium или high.";
  }

  const rawId = draft.categoryId;
  const categoryId = typeof rawId === "number" ? rawId : Number(rawId);
  const list = Array.isArray(categories) ? categories : [];

  if (typeof rawId === "string" && !/^\d+$/.test(rawId.trim())) {
    errors.categoryId = "Выберите категорию.";
  } else if (!positiveId(categoryId) || list.find((item) => item.id === categoryId) === undefined) {
    errors.categoryId = "Выберите существующую категорию.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }

  return { valid: true, value: { title, priority: draft.priority, categoryId }, errors: {} };
}
