import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import TimeTrackingApp from "./Zeiterfassung";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TimeTrackingApp />
  </React.StrictMode>
);

// Service Worker registrieren
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.error("SW registration failed:", err));
  });
}
