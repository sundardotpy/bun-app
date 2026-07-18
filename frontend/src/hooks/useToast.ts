import { useCallback, useRef, useState } from "react";

const DURATION_MS = 3000;

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    timeoutRef.current = setTimeout(() => setMessage(null), DURATION_MS);
  }, []);

  return { toastMessage: message, showToast };
}
