import { createApiClient } from "./api-client.js";
import { createTaskApi } from "./task-api.js";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5505/api";
const client = createApiClient({ baseUrl });

export const api = createTaskApi(client);
