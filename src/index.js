import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SessionProvider } from "./context/SessionContext";
import { EventProvider } from "./context/EventContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

const container = document.getElementById("root");

if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <ToastProvider>
        <SessionProvider>
          <EventProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </EventProvider>
        </SessionProvider>
      </ToastProvider>
    </React.StrictMode>,
  );
}
