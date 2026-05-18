import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";

/* PREVENT NUMBER INPUT SCROLL CHANGES */
window.addEventListener(
  "wheel",
  () => {
    if (document.activeElement?.type === "number") {
      document.activeElement.blur();
    }
  },
  { passive: true },
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);