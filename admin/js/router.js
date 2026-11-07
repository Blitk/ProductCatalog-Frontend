
const pages = {
    dashboard: {
        element: "dashboard-page",
        title: "Dashboard"
    },
    products: {
        element: "products-page",
        title: "Produtos"
    },
    categories: {
        element: "categories-page",
        title: "Categorias"
    }
};

export function initializeRouter(callbacks = {}) {

    const pageTitle = document.getElementById("page-title");
    const navLinks = document.querySelectorAll("[data-page]");

    function navigate() {
        let currentPage = window.location.hash.replace("#", "");

        if (!pages[currentPage]) {
            currentPage = "dashboard";
        }

        Object.entries(pages).forEach(([key, page]) => {
            const element = document.getElementById(page.element);

            if (element) {
                element.hidden = key !== currentPage;
            }
        });

        pageTitle.textContent = pages[currentPage].title;

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.page === currentPage
            );
        });

        callbacks[currentPage]?.();
    }

    window.addEventListener("hashchange", navigate);

    navigate();
}
