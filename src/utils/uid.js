import { useMemo } from "react";
export function useStableId(prefix = "id") {
return useMemo(() => {
const base =
typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
? crypto.randomUUID()
: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
return `${prefix}-${base}`;
}, [prefix]);
}