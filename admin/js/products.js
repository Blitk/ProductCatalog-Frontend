
import { productService } from "./services/productService.js";
import { categoryService } from "./services/categoryService.js";
import { initializeProductModal } from "./components/productModal.js";
import { API_SERVER_URL } from "../../shared/js/config.js";

const PAGE_SIZE = 10;

const elements = {
    tableBody: document.getElementById("products-table-body"),
    search: document.getElementById("product-search"),
    searchButton: document.getElementById("search-product-button"),
    categoryFilter: document.getElementById("product-category-filter"),
    sort: document.getElementById("product-sort"),
    count: document.getElementById("products-count"),
    pagination: document.getElementById("products-pagination"),
    error: document.getElementById("products-error"),
    errorMessage: document.getElementById("products-error-message"),
    retryButton: document.getElementById("products-retry"),
    addButton: document.getElementById("add-product-button")
};

const state = {
    page: 0,
    totalPages: 0,
    totalElements: 0,
    requestId: 0
};

let productModal;

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

function formatPrice(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number(value));
}

function getImageUrl(imageUrl) {
    if (!imageUrl) {
        return "../assets/images/no-image.png";
    }

    if (/^https?:\/\//i.test(imageUrl)) {
        return imageUrl;
    }

    return `${API_SERVER_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function showError(message) {
    elements.error.hidden = false;
    elements.errorMessage.textContent = message;
}

function hideError() {
    elements.error.hidden = true;
    elements.errorMessage.textContent = "";
}

function showLoading() {
    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="table-message">
                Carregando produtos...
            </td>
        </tr>
    `;

    elements.count.textContent = "Carregando...";
    elements.pagination.innerHTML = "";
}

function renderEmpty() {
    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="table-message">
                Nenhum produto encontrado.
            </td>
        </tr>
    `;

    elements.count.textContent = "Nenhum produto encontrado";
    elements.pagination.innerHTML = "";
}

function renderProducts(products) {
    if (!products.length) {
        renderEmpty();
        return;
    }

    elements.tableBody.innerHTML = products.map(product => {
        const stock = Number(product.stockQuantity) || 0;
        const category = product.category?.name || "Sem categoria";

        return `
            <tr>
                <td>
                    <div class="admin-product-info">
                        <img
                            src="${escapeHTML(getImageUrl(product.imageUrl))}"
                            alt=""
                            class="admin-product-image"
                        >

                        <span>${escapeHTML(product.name)}</span>
                    </div>
                </td>

                <td>${escapeHTML(category)}</td>

                <td>${formatPrice(product.price)}</td>

                <td>
                    <span class="stock-label ${
                        stock > 0 ? "stock-positive" : "stock-negative"
                    }">
                        ${stock}
                    </span>
                </td>

                <td>
                    <div class="product-actions">
                        <button
                            type="button"
                            class="action-button"
                            data-action="edit"
                            data-id="${escapeHTML(product.id)}"
                            aria-label="Editar ${escapeHTML(product.name)}"
                            title="Editar produto">
                            Editar
                        </button>

                        <button
                            type="button"
                            class="action-button delete-action"
                            data-action="delete"
                            data-id="${escapeHTML(product.id)}"
                            aria-label="Excluir ${escapeHTML(product.name)}"
                            title="Excluir produto">
                            Excluir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    elements.tableBody.querySelectorAll("img").forEach(image => {
        image.addEventListener("error", () => {
            image.src = "../assets/images/no-image.png";
        }, { once: true });
    });
}

function renderPagination() {
    elements.pagination.innerHTML = "";

    if (state.totalPages <= 1) {
        return;
    }

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.textContent = "←";
    previousButton.disabled = state.page === 0;
    previousButton.setAttribute("aria-label", "Página anterior");

    previousButton.addEventListener("click", () => {
        if (state.page > 0) {
            state.page--;
            loadProducts();
        }
    });

    elements.pagination.appendChild(previousButton);

    const pageInfo = document.createElement("span");
    pageInfo.textContent = `${state.page + 1} de ${state.totalPages}`;
    elements.pagination.appendChild(pageInfo);

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "→";
    nextButton.disabled = state.page >= state.totalPages - 1;
    nextButton.setAttribute("aria-label", "Próxima página");

    nextButton.addEventListener("click", () => {
        if (state.page < state.totalPages - 1) {
            state.page++;
            loadProducts();
        }
    });

    elements.pagination.appendChild(nextButton);
}

async function loadProducts() {
    const currentRequestId = ++state.requestId;

    hideError();
    showLoading();

    const params = {
        name: elements.search.value.trim(),
        categoryId: elements.categoryFilter.value,
        page: state.page,
        size: PAGE_SIZE,
        sort: elements.sort.value
    };

    try {
        const response = await productService.filterProducts(params);

        if (currentRequestId !== state.requestId) {
            return;
        }

        const products = Array.isArray(response)
            ? response
            : response.content || [];

        state.totalPages = response.totalPages ?? (
            products.length > 0 ? 1 : 0
        );

        state.totalElements = response.totalElements ?? products.length;

        renderProducts(products);

        elements.count.textContent =
            `${state.totalElements} produto(s) encontrado(s)`;

        renderPagination();

    } catch (error) {
        if (currentRequestId !== state.requestId) {
            return;
        }

        console.error("Erro ao carregar produtos:", error);

        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-message">
                    Não foi possível carregar os produtos.
                </td>
            </tr>
        `;

        elements.count.textContent = "Erro ao carregar";

        showError(
            "Verifique se o backend está funcionando e tente novamente."
        );
    }
}

async function loadCategories() {
    try {
        const response = await categoryService.getCategories();

        const categories = Array.isArray(response)
            ? response
            : response.content || [];

        elements.categoryFilter.innerHTML = `
            <option value="">Todas as categorias</option>
        `;

        categories.forEach(category => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            elements.categoryFilter.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

async function deleteProduct(id) {
    const confirmed = window.confirm(
        "Tem certeza de que deseja excluir este produto?"
    );

    if (!confirmed) {
        return;
    }

    try {
        await productService.deleteProduct(id);

        // Se a página atual ficar vazia, volta uma página.
        if (
            state.page > 0 &&
            state.totalElements - 1 <= state.page * PAGE_SIZE
        ) {
            state.page--;
        }

        await loadProducts();

    } catch (error) {
        console.error("Erro ao excluir produto:", error);

        showError(
            `Não foi possível excluir o produto: ${error.message}`
        );
    }
}

function initializeEvents() {
    elements.searchButton.addEventListener("click", () => {
        state.page = 0;
        loadProducts();
    });

    elements.search.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            state.page = 0;
            loadProducts();
        }
    });

    elements.categoryFilter.addEventListener("change", () => {
        state.page = 0;
        loadProducts();
    });

    elements.sort.addEventListener("change", () => {
        state.page = 0;
        loadProducts();
    });

    elements.retryButton.addEventListener("click", loadProducts);

    elements.addButton.addEventListener("click", () => {
        productModal.openCreate();
    });

    elements.tableBody.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        const { action, id } = button.dataset;

        if (action === "edit") {
            productModal.openEdit(id);
        }

        if (action === "delete") {
            deleteProduct(id);
        }
    });
}

export async function initializeProducts() {
    productModal = initializeProductModal({
        onSaved: loadProducts
    });

    initializeEvents();

    await loadCategories();
    await loadProducts();
}
