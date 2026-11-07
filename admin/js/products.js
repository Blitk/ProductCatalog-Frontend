
import { productService } from "./services/productService.js";
import { categoryService } from "./services/categoryService.js";
import { initializeProductModal } from "./components/productModal.js";
import { API_SERVER_URL } from "../../shared/js/config.js";

const PAGE_SIZE = 10;
const DEFAULT_IMAGE = "../assets/images/no-image.png";

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
    requestId: 0,
    isDeleting: false
};

let productModal;

// =================================
// UTILITIES
// =================================

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
    const price = Number(value);

    if (!Number.isFinite(price)) {
        return "Preço indisponível";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(price);
}

function getImageUrl(imageUrl) {
    if (!imageUrl) {
        return DEFAULT_IMAGE;
    }

    if (/^https?:\/\//i.test(imageUrl)) {
        return imageUrl;
    }

    return `${API_SERVER_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.error.hidden = false;
}

function hideError() {
    elements.errorMessage.textContent = "";
    elements.error.hidden = true;
}

// =================================
// TABLE STATES
// =================================

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

// =================================
// PRODUCT TABLE
// =================================

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
                            loading="lazy"
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
                            title="Excluir produto"
                            ${state.isDeleting ? "disabled" : ""}>

                            Excluir

                        </button>

                    </div>
                </td>
            </tr>
        `;
    }).join("");

    configureImageFallbacks();
}

function configureImageFallbacks() {
    const images = elements.tableBody.querySelectorAll("img");

    images.forEach(image => {
        image.addEventListener("error", () => {
            if (!image.src.endsWith(DEFAULT_IMAGE)) {
                image.src = DEFAULT_IMAGE;
            }
        }, { once: true });
    });
}

// =================================
// PAGINATION
// =================================

function createPaginationButton(label, ariaLabel, disabled, callback) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    button.setAttribute("aria-label", ariaLabel);

    button.addEventListener("click", callback);

    return button;
}

function renderPagination() {
    elements.pagination.innerHTML = "";

    if (state.totalPages <= 1) {
        return;
    }

    const previousButton = createPaginationButton(
        "←",
        "Página anterior",
        state.page === 0,
        () => changePage(state.page - 1)
    );

    const pageInfo = document.createElement("span");

    pageInfo.textContent =
        `Página ${state.page + 1} de ${state.totalPages}`;

    pageInfo.setAttribute("aria-live", "polite");

    const nextButton = createPaginationButton(
        "→",
        "Próxima página",
        state.page >= state.totalPages - 1,
        () => changePage(state.page + 1)
    );

    elements.pagination.append(
        previousButton,
        pageInfo,
        nextButton
    );
}

function changePage(page) {
    if (page < 0 || page >= state.totalPages) {
        return;
    }

    state.page = page;
    loadProducts();
}

// =================================
// PRODUCTS REQUEST
// =================================

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

        // Ignora respostas de requisições antigas.
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

        // A página atual pode deixar de existir após filtros ou exclusões.
        if (
            state.totalPages > 0 &&
            state.page >= state.totalPages
        ) {
            state.page = state.totalPages - 1;
            return loadProducts();
        }

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
            `Não foi possível carregar os produtos: ${error.message}`
        );
    }
}

// =================================
// CATEGORY FILTER
// =================================

async function loadCategories() {
    try {
        const response = await categoryService.getCategories();

        const categories = Array.isArray(response)
            ? response
            : response.content || [];

        const selectedCategory = elements.categoryFilter.value;

        elements.categoryFilter.innerHTML = `
            <option value="">Todas as categorias</option>
        `;

        categories.forEach(category => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            elements.categoryFilter.appendChild(option);
        });

        const categoryExists = categories.some(
            category => String(category.id) === selectedCategory
        );

        if (categoryExists) {
            elements.categoryFilter.value = selectedCategory;
        }

    } catch (error) {
        console.error("Erro ao carregar categorias:", error);

        showError(
            "Não foi possível carregar as categorias para filtragem."
        );
    }
}

// =================================
// DELETE PRODUCT
// =================================

async function deleteProduct(id) {
    if (state.isDeleting) {
        return;
    }

    const confirmed = window.confirm(
        "Tem certeza de que deseja excluir este produto?"
    );

    if (!confirmed) {
        return;
    }

    state.isDeleting = true;

    try {
        await productService.deleteProduct(id);

        // Atualiza o total antes de decidir se deve voltar uma página.
        state.totalElements = Math.max(0, state.totalElements - 1);

        if (
            state.page > 0 &&
            state.totalElements <= state.page * PAGE_SIZE
        ) {
            state.page--;
        }

        await loadProducts();

    } catch (error) {
        console.error("Erro ao excluir produto:", error);

        showError(
            `Não foi possível excluir o produto: ${error.message}`
        );
    } finally {
        state.isDeleting = false;
    }
}

// =================================
// EVENTS
// =================================

function handleSearch() {
    state.page = 0;
    loadProducts();
}

function initializeEvents() {
    elements.searchButton.addEventListener("click", handleSearch);

    elements.search.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    elements.categoryFilter.addEventListener("change", handleSearch);

    elements.sort.addEventListener("change", handleSearch);

    elements.retryButton.addEventListener("click", loadProducts);

    elements.addButton.addEventListener("click", () => {
        productModal.openCreate();
    });

    elements.tableBody.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");

        if (!button || button.disabled) {
            return;
        }

        const { action, id } = button.dataset;

        if (!id) {
            return;
        }

        if (action === "edit") {
            productModal.openEdit(id);
        }

        if (action === "delete") {
            deleteProduct(id);
        }
    });
}

// =================================
// INITIALIZATION
// =================================

export async function initializeProducts() {
    productModal = initializeProductModal({
        onSaved: loadProducts
    });

    initializeEvents();

    await loadCategories();
    await loadProducts();
}
