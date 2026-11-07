
import { initializeSidebar } from "./components/sidebar.js";
import { initializeRouter } from "./router.js";
import { initializeDashboard } from "./dashboard.js";
import { initializeProducts } from "./products.js";
import { initializeCategories } from "./categories.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeSidebar();

    let dashboardInitialized = false;
    let productsInitialized = false;
    let categoriesInitialized = false;

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
        },

        categories() {
            if (!categoriesInitialized) {
                categoriesInitialized = true;
                initializeCategories();
            }
        }
    });
});
