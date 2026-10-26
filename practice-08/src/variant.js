export const variantNumber = 6;

const FILTERS_BY_VARIANT = {
  1: { q: "", completed: "false", priority: "", categoryId: "" },
  2: { q: "", completed: "true", priority: "", categoryId: "" },
  3: { q: "", completed: "", priority: "high", categoryId: "" },
  4: { q: "", completed: "", priority: "medium", categoryId: "" },
  5: { q: "", completed: "", priority: "", categoryId: "1" },
  6: { q: "", completed: "", priority: "", categoryId: "2" },
  7: { q: "провер", completed: "", priority: "", categoryId: "" },
  8: { q: "", completed: "false", priority: "high", categoryId: "2" },
};

const API_FILTERS_BY_VARIANT = {
  1: { completed: false },
  2: { completed: true },
  3: { priority: "high" },
  4: { priority: "medium" },
  5: { categoryId: 1 },
  6: { categoryId: 2 },
  7: { q: "провер" },
  8: { completed: false, priority: "high", categoryId: 2 },
};

function normalizeVariantNumber(number) {
  return ((number - 1) % 8) + 1;
}

export function createInitialFilters(number = variantNumber) {
  return { ...FILTERS_BY_VARIANT[normalizeVariantNumber(number)] };
}

export function getVariantFilters(number = variantNumber) {
  return { ...API_FILTERS_BY_VARIANT[normalizeVariantNumber(number)] };
}

export const EMPTY_FILTERS = { q: "", completed: "", priority: "", categoryId: "" };
