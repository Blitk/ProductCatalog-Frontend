
import { initializeSidebar } from "./components/sidebar.js";
import { initializeRouter } from "./router.js";
import { initializeDashboard } from "./dashboard.js";
import { initializeProducts } from "./products.js";

document.addEventListener("DOMContentLoaded", () => {

    initializeSidebar();

    let dashboardInitialized = false;
    let productsInitialized = false;

    initializeRouter({

        dashboard() {
            if (!dashboardInitialized) {
                dashboardInitialized = true;
                initializeDashboard();
            }
        },

        products() {
            if (!productsInitialized) {
                productsInitialized = true;
                initializeProducts();
            }
        }

    });

});
