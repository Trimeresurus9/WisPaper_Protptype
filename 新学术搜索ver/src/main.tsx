import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { CloudHostStates } from "./components/sandbox/CloudHostStates";
import "./index.css";

const demoParams = new URLSearchParams(window.location.search);
if (demoParams.get("onboarding") === "1" && demoParams.get("guest") === "1") {
  try { window.localStorage.setItem("wispaper-prototype-auth-state", "guest"); } catch { /* prototype storage */ }
}

createRoot(document.getElementById("root")!).render(window.location.pathname === "/mock/cloud-host-states" ? <CloudHostStates /> : <App />);
