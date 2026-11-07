
import { initializeSidebar } from "./components/sidebar.js";
import { initializeDashboard } from "./dashboard.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeSidebar();
    initializeDashboard();
});
