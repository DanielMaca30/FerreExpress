// src/utils/useCartCount.js
import { useEffect, useState } from "react";
import { getTotals } from "./cartStore";

export default function useCartCount(pollMs = 400) {
  const [count, setCount] = useState(() => getTotals().count);
  useEffect(() => {
    const id = setInterval(() => setCount(getTotals().count), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);
  return count;
}
