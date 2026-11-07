
import { api } from "../../shared/js/api.js";
import { API_SERVER_URL } from "../../shared/js/config.js";

const elements = {
    totalProducts: document.getElementById("total-products"),
    totalCategories: document.getElementById("total-categories"),
    availableProducts: document.getElementById("available-products"),
    unavailableProducts: document.getElementById("unavailable-products"),
    recentProducts: document.getElementById("recent-products"),
    error: document.getElementById("dashboard-error"),
    errorMessage: document.getElementById("dashboard-error-message"),
    retryButton: document.getElementById("dashboard-retry")
};

function buildQuery(params) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.append(key, value);
        }
    });

    return query.toString();
}

async function getProductPage(params = {}) {
    const query = buildQuery(params);
    return api.get(`/products?${query}`);
}

async function getFilteredProductPage(params = {}) {
    const query = buildQuery(params);
    return api.get(`/products/filter?${query}`);
}

function getTotalElements(response) {
    if (Array.isArray(response)) {
        return response.length;
    }

    return response?.totalElements ?? 0;
}

function formatPrice(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number(value));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function getImageUrl(imageUrl) {
    if (!imageUrl) {
        return "../../assets/images/no-image.png";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }

    return `${API_SERVER_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function renderRecentProducts(products) {
    if (!products.length) {
        elements.recentProducts.innerHTML = `
            <tr>
                <td colspan="4" class="table-message">
                    Nenhum produto cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    elements.recentProducts.innerHTML = products.map(product => {
        const category = product.category?.name || "Sem categoria";
        const stock = Number(product.stockQuantity) || 0;

        return `
            <tr>
                <td>
                    <div class="dashboard-product">
                        <img
                            src="${escapeHTML(getImageUrl(product.imageUrl))}"
                            alt=""
                            class="dashboard-product-image"
                        >
                        <span>${escapeHTML(product.name)}</span>
                    </div>
                </td>

                <td>${escapeHTML(category)}</td>

                <td>${formatPrice(product.price)}</td>

                <td>
                    <span class="stock-label ${stock > 0 ? "stock-positive" : "stock-negative"}">
                        ${stock}
                    </span>
                </td>
            </tr>
        `;
    }).join("");

    elements.recentProducts.querySelectorAll("img").forEach(image => {
        image.addEventListener("error", () => {
            image.src = "../../assets/images/no-image.png";
        }, { once: true });
    });
}

function showError(message) {
    elements.error.hidden = false;
    elements.errorMessage.textContent = message;
}

function hideError() {
    elements.error.hidden = true;
    elements.errorMessage.textContent = "";
}

async function loadDashboard() {
    hideError();

    elements.recentProducts.innerHTML = `
        <tr>
            <td colspan="4" class="table-message">
                Carregando produtos...
            </td>
        </tr>
    `;

    try {
        const [
            productsResponse,
            categoriesResponse,
            availableResponse,
            unavailableResponse,
            recentResponse
        ] = await Promise.all([
            getProductPage({ page: 0, size: 1 }),
            api.get("/categories"),
            getFilteredProductPage({ minStock: 1, page: 0, size: 1 }),
            getFilteredProductPage({ maxStock: 0, page: 0, size: 1 }),
            getProductPage({ page: 0, size: 5, sort: "id,desc" })
        ]);

        elements.totalProducts.textContent =
            getTotalElements(productsResponse);

        elements.totalCategories.textContent =
            getTotalElements(categoriesResponse);

        elements.availableProducts.textContent =
            getTotalElements(availableResponse);

        elements.unavailableProducts.textContent =
            getTotalElements(unavailableResponse);

        const recentProducts = Array.isArray(recentResponse)
            ? recentResponse
            : recentResponse.content || [];

        renderRecentProducts(recentProducts);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);

        elements.recentProducts.innerHTML = `
            <tr>
                <td colspan="4" class="table-message">
                    Não foi possível carregar os dados.
                </td>
            </tr>
        `;

        showError(
            "Não foi possível carregar o dashboard. Verifique se a API está funcionando."
        );
    }
}

export function initializeDashboard() {
    elements.retryButton.addEventListener("click", loadDashboard);
    loadDashboard();
}
