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
async function initPush() {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    const reg = await navigator.serviceWorker.ready;

    // Nach Erlaubnis fragen
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Push-Benachrichtigungen wurden blockiert.");
      return;
    }

    // Push-Subscription erstellen
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: "<DEIN_PUBLIC_VAPID_KEY>"
    });

    console.log("Push Subscription:", JSON.stringify(subscription));
    // Diese Subscription musst du an deinen Server senden
  }
}
