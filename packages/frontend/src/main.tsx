import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Enable mock API layer before any components mount (frontend-only dev mode)
if (import.meta.env.VITE_MOCK_API === "true") {
  const { enableMockApi } = await import("@/api/mock-api");
  enableMockApi();
}

const { App } = await import("./app");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
