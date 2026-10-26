import { useEffect, useState } from "react";

/** Дополнительное задание: время последнего успешного обновления снимка. */
export function useLastUpdated(snapshot, status) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (status === "ready") {
      setLabel(new Date().toLocaleString("ru-RU"));
    }
  }, [snapshot, status]);

  return label;
}
