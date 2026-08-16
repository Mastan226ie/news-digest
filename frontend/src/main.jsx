import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Apply saved theme before first paint to prevent flash
try {
  const savedTheme = localStorage.getItem("mba-digest-theme");
  if (savedTheme && ["paper", "sage", "alabaster", "dark"].includes(savedTheme)) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    document.documentElement.setAttribute("data-theme", "paper");
  }
} catch {}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
