import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing React root");
}

createRoot(root).render(
  <StrictMode>
    <main>TypeScript 7</main>
  </StrictMode>,
);
