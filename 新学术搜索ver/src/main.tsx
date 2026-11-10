
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import { CloudHostStates } from "./components/sandbox/CloudHostStates";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(window.location.pathname === "/mock/cloud-host-states" ? <CloudHostStates /> : <App />);
  