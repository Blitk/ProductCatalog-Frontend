
import { productService } from "./services/productService.js";
import { API_SERVER_URL, DEFAULT_PAGE_SIZE } from "../../shared/js/config.js";

const productGrid = document.getElementById("product-grid");
const catalogMessage = document.getElementById("catalog-message");
const productCount = document.getElementById("product-count");
const pagination = document.getElementById("pagination");

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearButton = document.getElementById("clear-button");
const categoryFilter = document.getElementById("category-filter");

let currentPage = 0;
let totalPages = 0;

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

    return `${API_SERVER_URL}${imageUrl}`;
}

function renderProduct(product) {
    const categoryName = product.category?.name || "Sem categoria";
    const imageUrl = getImageUrl(product.imageUrl);
    const available = product.stockQuantity > 0;

    const image = imageUrl
        ? `<img
                class="product-image"
                src="${escapeHTML(imageUrl)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.hidden=false;"
           >
           <div class="product-image-placeholder" hidden>
                Imagem indisponível
           </div>`
        : `<div class="product-image-placeholder">
                Sem imagem
           </div>`;

    return `
        <article class="product-card">

            <div class="product-image-container">
                ${image}
            </div>

            <div class="product-info">

                <span class="product-category">
                    ${escapeHTML(categoryName)}
                </span>

                <h3 class="product-name">
                    ${escapeHTML(product.name)}
                </h3>

                <p class="product-description">
                    ${escapeHTML(product.description || "Sem descrição disponível.")}
                </p>

                <p class="product-price">
                    ${formatPrice(product.price)}
                </p>

                <p class="product-stock ${available ? "" : "unavailable"}">
                    ${available
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

function renderPagination() {
    pagination.innerHTML = "";

    if (totalPages <= 1) {
        return;
    }

    const previousButton = document.createElement("button");
    previousButton.textContent = "Anterior";
    previousButton.disabled = currentPage === 0;

    previousButton.addEventListener("click", () => {
        loadProducts(currentPage - 1);
    });

    pagination.appendChild(previousButton);

    for (let page = 0; page < totalPages; page++) {
        const button = document.createElement("button");

        button.textContent = String(page + 1);
        button.classList.toggle("active", page === currentPage);
        button.setAttribute("aria-label", `Página ${page + 1}`);
        button.setAttribute(
            "aria-current",
            page === currentPage ? "page" : "false"
        );

        button.addEventListener("click", () => {
            loadProducts(page);
        });

        pagination.appendChild(button);
    }

    const nextButton = document.createElement("button");
    nextButton.textContent = "Próxima";
    nextButton.disabled = currentPage >= totalPages - 1;

    nextButton.addEventListener("click", () => {
        loadProducts(currentPage + 1);
    });

    pagination.appendChild(nextButton);
}

async function loadProducts(page = 0) {
    currentPage = page;

    productGrid.innerHTML = "";
    pagination.innerHTML = "";

    catalogMessage.hidden = false;
    catalogMessage.classList.remove("error");
    catalogMessage.textContent = "Carregando produtos...";

    try {
        const filters = {
            name: searchInput.value.trim(),
            categoryId: categoryFilter.value,
            page: currentPage,
            size: DEFAULT_PAGE_SIZE,
            sort: "id,desc"
        };

        const result = await productService.filterProducts(filters);

        const products = result.content || [];

        totalPages = result.totalPages || 0;

        productCount.textContent =
            `${result.totalElements ?? products.length} produto(s)`;

        if (products.length === 0) {
            catalogMessage.textContent =
                "Nenhum produto encontrado com esses filtros.";

            pagination.innerHTML = "";
            return;
        }

        catalogMessage.hidden = true;

        productGrid.innerHTML = products
            .map(renderProduct)
            .join("");

        renderPagination();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);

        catalogMessage.hidden = false;
        catalogMessage.classList.add("error");
        catalogMessage.textContent =
            `Não foi possível carregar os produtos: ${error.message}`;

        productCount.textContent = "";
    }
}

async function loadCategories() {
    try {
        const result = await productService.getCategories();

        // Compatibilidade com resposta em lista ou Page do Spring.
        const categories = Array.isArray(result)
            ? result
            : result.content || [];

        for (const category of categories) {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            categoryFilter.appendChild(option);
        }

    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

function searchProducts() {
    loadProducts(0);
}

searchButton.addEventListener("click", searchProducts);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchProducts();
    }
});

categoryFilter.addEventListener("change", searchProducts);

clearButton.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "";

    loadProducts(0);
});

export async function initializeCatalog() {
    await loadCategories();
    await loadProducts();
}
