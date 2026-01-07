import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureRestNonce } from "@/services/axiosConfig";

const bootstrap = async () => {
  await ensureRestNonce();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

bootstrap();
