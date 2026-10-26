import { ApiError } from "./errors.js";

const ALLOWED_FILTERS = ["completed", "priority", "categoryId", "q"];
const PRIORITIES = ["low", "medium", "high"];
const Q_MAX_LENGTH = 100;

export function parsePositiveId(raw) {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) {
    return null;
  }

  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

export function parseFilters(searchParams) {
  for (const name of searchParams.keys()) {
    if (!ALLOWED_FILTERS.includes(name)) {
      throw new ApiError(400, "INVALID_QUERY", `Неизвестный параметр запроса: ${name}.`);
    }

    if (searchParams.getAll(name).length > 1) {
      throw new ApiError(400, "INVALID_QUERY", `Параметр ${name} указан более одного раза.`);
    }
  }

  const filters = {
    completed: null,
    priority: null,
    categoryId: null,
    q: "",
  };

  if (searchParams.has("completed")) {
    const raw = searchParams.get("completed");

    if (raw !== "true" && raw !== "false") {
      throw new ApiError(400, "INVALID_QUERY", "Параметр completed принимает только значения true и false.");
    }

    filters.completed = raw === "true";
  }

  if (searchParams.has("priority")) {
    const raw = searchParams.get("priority");

    if (!PRIORITIES.includes(raw)) {
      throw new ApiError(400, "INVALID_QUERY", `Параметр priority принимает только значения: ${PRIORITIES.join(", ")}.`);
    }

    filters.priority = raw;
  }

  if (searchParams.has("categoryId")) {
    const raw = searchParams.get("categoryId");

    if (raw === "") {
      throw new ApiError(400, "INVALID_QUERY", "Параметр categoryId не может быть пустым.");
    }

    const value = parsePositiveId(raw);

    if (value === null) {
      throw new ApiError(400, "INVALID_QUERY", "Параметр categoryId должен быть положительным целым числом.");
    }

    filters.categoryId = value;
  }

  if (searchParams.has("q")) {
    const raw = searchParams.get("q");
    const trimmed = raw.trim();

    if (trimmed.length > Q_MAX_LENGTH) {
      throw new ApiError(400, "INVALID_QUERY", `Параметр q не должен быть длиннее ${Q_MAX_LENGTH} символов.`);
    }

    filters.q = trimmed;
  }

  return filters;
}
