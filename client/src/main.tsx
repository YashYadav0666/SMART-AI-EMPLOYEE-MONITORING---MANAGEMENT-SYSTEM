import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add some debug info logging
console.log("Application starting...");
console.log("Current host:", window.location.host);
console.log("Current origin:", window.location.origin);

try {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
  console.log("App successfully rendered");
} catch (error) {
  console.error("Error rendering app:", error);
  // Display a fallback UI for severe errors
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Something went wrong</h2>
        <p>The application encountered an error during startup.</p>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
}
