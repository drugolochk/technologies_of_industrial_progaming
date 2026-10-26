import { useCallback, useEffect, useRef, useState } from "react";

const EMPTY_SNAPSHOT = {
  tasks: [],
  categories: [],
  meta: { total: 0 },
};

export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);

  const mountedRef = useRef(true);
  const mutationRef = useRef(null);

  const { q, completed, priority, categoryId } = filters;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      mutationRef.current?.abort();
      mutationRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function run() {
      setStatus("loading");
      setError(null);

      try {
        const data = await api.loadInitialData(
          { q, completed, priority, categoryId },
          { signal: controller.signal }
        );

        if (!active) {
          return;
        }

        setSnapshot(data);
        setStatus("ready");
      } catch (loadError) {
        if (!active) {
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        setError(loadError);
        setStatus("error");
      }
    }

    void run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [api, q, completed, priority, categoryId, revision]);

  const refresh = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  const mutate = useCallback(async (operation) => {
    if (!mountedRef.current || mutationRef.current !== null) {
      return false;
    }

    const controller = new AbortController();
    mutationRef.current = controller;

    setPending(true);
    setMutationError(null);

    try {
      await operation(controller.signal);

      if (!mountedRef.current) {
        return false;
      }

      setRevision((value) => value + 1);

      return true;
    } catch (mutationFailure) {
      if (!mountedRef.current) {
        return false;
      }

      setMutationError(mutationFailure);

      return false;
    } finally {
      if (mutationRef.current === controller) {
        mutationRef.current = null;
      }

      if (mountedRef.current) {
        setPending(false);
      }
    }
  }, []);

  const saveTask = useCallback(
    (id, value) => {
      if (id === null || id === undefined) {
        return mutate((signal) => api.createTask(value, { signal }));
      }

      return mutate((signal) => api.updateTask(id, value, { signal }));
    },
    [api, mutate]
  );

  const toggleTask = useCallback(
    (task) => mutate((signal) => api.setTaskCompleted(task.id, !task.completed, { signal })),
    [api, mutate]
  );

  const deleteTask = useCallback(
    (id) => mutate((signal) => api.deleteTask(id, { signal })),
    [api, mutate]
  );

  const resetData = useCallback(
    () => mutate((signal) => api.resetDemoData({ signal })),
    [api, mutate]
  );

  return {
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
  };
}
