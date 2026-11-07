
import { productService } from "./services/productService.js";
import {
    API_SERVER_URL,
    DEFAULT_PAGE_SIZE
} from "../../shared/js/config.js";

// ==========================================
// Elementos do DOM
// ==========================================

const productGrid = document.getElementById("product-grid");
const catalogMessage = document.getElementById("catalog-message");

const messageIcon = document.getElementById("message-icon");
const messageTitle = document.getElementById("message-title");
const messageDescription = document.getElementById("message-description");
const retryButton = document.getElementById("retry-button");

const productCount = document.getElementById("product-count");
const pagination = document.getElementById("pagination");

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearButton = document.getElementById("clear-button");

const categoryFilter = document.getElementById("category-filter");
const sortSelect = document.getElementById("sort-select");

// ==========================================
// Estado do catálogo
// ==========================================

let currentPage = 0;
let totalPages = 0;
let totalElements = 0;

let isLoading = false;

// ==========================================
// Utilitários
// ==========================================

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => {
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
    }).format(value);
}

function getImageUrl(imageUrl) {
    if (!imageUrl) {
        return null;
    }

    // Aceita somente caminhos relativos ou URLs HTTP(S).
    if (
        !imageUrl.startsWith("/") &&
        !imageUrl.startsWith("http://") &&
        !imageUrl.startsWith("https://")
    ) {
        return null;
    }

    return imageUrl.startsWith("/")
        ? `${API_SERVER_URL}${imageUrl}`
        : imageUrl;
}

// ==========================================
// Renderização de produtos
// ==========================================

function renderProductImage(product) {
    const imageUrl = getImageUrl(product.imageUrl);

    if (!imageUrl) {
        return `
            <div class="product-image-placeholder">
                Sem imagem
            </div>
        `;
    }

    return `
        <img
            class="product-image"
            src="${escapeHTML(imageUrl)}"
            alt="${escapeHTML(product.name)}"
            loading="lazy"
        >
        <div class="product-image-placeholder" hidden>
            Imagem indisponível
        </div>
    `;
}

function renderProduct(product) {
    const categoryName = product.category?.name || "Sem categoria";

    const available = Number(product.stockQuantity) > 0;

    return `
        <article class="product-card">

            <div class="product-image-container">
                ${renderProductImage(product)}
            </div>

            <div class="product-info">

                <span class="product-category">
                    ${escapeHTML(categoryName)}
                </span>

                <h3 class="product-name">
                    ${escapeHTML(product.name)}
                </h3>

                <p class="product-description">
                    ${escapeHTML(
                        product.description || "Sem descrição disponível."
                    )}
                </p>

                <p class="product-price">
                    ${formatPrice(product.price)}
                </p>

                <p class="product-stock ${available ? "" : "unavailable"}">
                    ${
                        available
                            ? `${product.stockQuantity} unidade(s) disponível(is)`
                            : "Produto indisponível"
                    }
                </p>

                <a
                    href="./product.html?id=${encodeURIComponent(product.id)}"
                    class="product-details-link"
                >
                    Ver detalhes
                </a>

            </div>

        </article>
    `;
}

function renderProducts(products) {
    productGrid.innerHTML = products
        .map(product => renderProduct(product))
        .join("");

    // Tratamento de imagens que não carregaram.
    const images = productGrid.querySelectorAll(".product-image");

    images.forEach(image => {
        image.addEventListener("error", () => {
            image.hidden = true;

            const placeholder = image.nextElementSibling;

            if (placeholder) {
                placeholder.hidden = false;
            }
        }, { once: true });
    });
}

// ==========================================
// Estados do catálogo
// ==========================================

function showCatalogMessage(
    icon,
    title,
    description,
    showRetry = false
) {
    catalogMessage.hidden = false;

    messageIcon.textContent = icon;
    messageTitle.textContent = title;
    messageDescription.textContent = description;

    retryButton.hidden = !showRetry;

    productGrid.innerHTML = "";
}

function hideCatalogMessage() {
    catalogMessage.hidden = true;
}

function showLoading() {
    showCatalogMessage(
        "⏳",
        "Carregando produtos...",
        "Estamos buscando os produtos disponíveis."
    );
}

function showEmptyCatalog() {
    showCatalogMessage(
        "📦",
        "Nenhum produto encontrado",
        "Não encontramos produtos com os critérios selecionados."
    );
}

function showError() {
    showCatalogMessage(
        "⚠️",
        "Não foi possível carregar os produtos",
        "Verifique sua conexão e tente novamente.",
        true
    );
}

// ==========================================
// Paginação
// ==========================================

function createPaginationButton(label, page, disabled = false) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;

    button.addEventListener("click", () => {
        loadProducts(page);
    });

    return button;
}

function renderPagination() {
    pagination.innerHTML = "";

    if (totalPages <= 1) {
        return;
    }

    const previousButton = createPaginationButton(
        "Anterior",
        currentPage - 1,
        currentPage === 0
    );

    pagination.appendChild(previousButton);

    for (let page = 0; page < totalPages; page++) {
        const button = createPaginationButton(
            String(page + 1),
            page
        );

        button.classList.toggle("active", page === currentPage);

        button.setAttribute(
            "aria-label",
            `Página ${page + 1}`
        );

        if (page === currentPage) {
            button.setAttribute("aria-current", "page");
        }

        pagination.appendChild(button);
    }

    const nextButton = createPaginationButton(
        "Próxima",
        currentPage + 1,
        currentPage >= totalPages - 1
    );

    pagination.appendChild(nextButton);
}

// ==========================================
// Carregamento de produtos
// ==========================================

async function loadProducts(page = 0) {
    if (isLoading) {
        return;
    }

    currentPage = page;
    isLoading = true;

    showLoading();

    pagination.innerHTML = "";

    try {
        const result = await productService.filterProducts({
            name: searchInput.value.trim(),
            categoryId: categoryFilter.value,
            page: currentPage,
            size: DEFAULT_PAGE_SIZE,
            sort: sortSelect.value
        });

        const products = result.content || [];

        totalPages = result.totalPages || 0;
        totalElements = result.totalElements || 0;

        productCount.textContent =
            `${totalElements} produtos encontrados`;

        if (products.length === 0) {
            showEmptyCatalog();
            return;
        }

        hideCatalogMessage();

        renderProducts(products);
        renderPagination();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);

        productCount.textContent =
            "Não foi possível carregar os produtos.";

        totalPages = 0;
        totalElements = 0;

        showError();

    } finally {
        isLoading = false;
    }
}

// ==========================================
// Carregamento de categorias
// ==========================================

async function loadCategories() {
    try {
        const result = await productService.getCategories();

        const categories = Array.isArray(result)
            ? result
            : result.content || [];

        categoryFilter.innerHTML =
            '<option value="">Todas as categorias</option>';

        categories.forEach(category => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            categoryFilter.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

// ==========================================
// Filtros e ordenação
// ==========================================

function searchProducts() {
    loadProducts(0);
}

function clearFilters() {
    searchInput.value = "";
    categoryFilter.value = "";
    sortSelect.value = "createdAt,desc";

    loadProducts(0);
}

// ==========================================
// Eventos
// ==========================================

function initializeEvents() {

    searchButton.addEventListener("click", searchProducts);

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            searchProducts();
        }
    });

    categoryFilter.addEventListener("change", searchProducts);

    sortSelect.addEventListener("change", searchProducts);

    clearButton.addEventListener("click", clearFilters);

    retryButton.addEventListener("click", () => {
        loadProducts(currentPage);
    });
}

// ==========================================
// Inicialização
// ==========================================

export async function initializeCatalog() {
    initializeEvents();

    await loadCategories();
    await loadProducts();
}
