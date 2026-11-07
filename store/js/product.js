
import { productService } from "./services/productService.js";
import { API_SERVER_URL } from "../../shared/js/config.js";

// ==========================================
// Elementos do DOM
// ==========================================

const productMessage = document.getElementById("product-message");
const productDetails = document.getElementById("product-details");

const messageElements = {
    icon: document.getElementById("message-icon"),
    title: document.getElementById("message-title"),
    description: document.getElementById("message-description"),
    retryButton: document.getElementById("retry-button")
};

const elements = {
    image: document.getElementById("product-image"),
    imagePlaceholder: document.getElementById("image-placeholder"),
    category: document.getElementById("product-category"),
    name: document.getElementById("product-name"),
    price: document.getElementById("product-price"),
    description: document.getElementById("product-description"),
    stock: document.getElementById("product-stock"),
    stockIndicator: document.getElementById("stock-indicator"),
    id: document.getElementById("product-id"),
    breadcrumb: document.getElementById("breadcrumb-product")
};

// ==========================================
// Estado da página
// ==========================================

let currentProductId = null;
let isLoading = false;

// ==========================================
// Utilitários
// ==========================================

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
// Estados da página
// ==========================================

function showMessage(icon, title, description, showRetry = false) {
    productMessage.hidden = false;

    messageElements.icon.textContent = icon;
    messageElements.title.textContent = title;
    messageElements.description.textContent = description;

    messageElements.retryButton.hidden = !showRetry;

    productDetails.hidden = true;
}

function showLoading() {
    showMessage(
        "⏳",
        "Carregando produto...",
        "Estamos buscando as informações do produto."
    );
}

function showError(title, description, showRetry = false) {
    showMessage(
        "⚠️",
        title,
        description,
        showRetry
    );
}

function hideMessage() {
    productMessage.hidden = true;
}

// ==========================================
// Imagem do produto
// ==========================================

function showImagePlaceholder() {
    elements.image.hidden = true;
    elements.image.removeAttribute("src");

    elements.imagePlaceholder.hidden = false;
}

function loadProductImage(imageUrl, productName) {
    const url = getImageUrl(imageUrl);

    if (!url) {
        showImagePlaceholder();
        return;
    }

    elements.image.hidden = true;
    elements.imagePlaceholder.hidden = false;

    elements.image.alt = productName;

    elements.image.onload = () => {
        elements.imagePlaceholder.hidden = true;
        elements.image.hidden = false;
    };

    elements.image.onerror = () => {
        showImagePlaceholder();
    };

    elements.image.src = url;
}

// ==========================================
// Renderização do produto
// ==========================================

function renderStock(stockQuantity) {
    const available = Number(stockQuantity) > 0;

    elements.stock.textContent = available
        ? `${stockQuantity} unidade(s) disponível(is)`
        : "Produto indisponível";

    elements.stockIndicator.classList.toggle(
        "unavailable",
        !available
    );
}

function renderProduct(product) {
    elements.name.textContent = product.name;

    elements.category.textContent =
        product.category?.name || "Sem categoria";

    elements.price.textContent = formatPrice(product.price);

    elements.description.textContent =
        product.description || "Nenhuma descrição disponível.";

    elements.id.textContent = product.id;

    elements.breadcrumb.textContent = product.name;

    renderStock(product.stockQuantity);

    loadProductImage(product.imageUrl, product.name);

    document.title = `${product.name} | ProductCatalog`;

    hideMessage();

    productDetails.hidden = false;
}

// ==========================================
// Carregamento do produto
// ==========================================

async function loadProduct() {
    if (isLoading || !currentProductId) {
        return;
    }

    isLoading = true;

    showLoading();

    try {
        const product = await productService.getProductById(
            currentProductId
        );

        if (!product || !product.id) {
            throw new Error("Resposta inválida da API.");
        }

        renderProduct(product);

    } catch (error) {
        console.error("Erro ao carregar produto:", error);

        if (error.status === 404) {
            showError(
                "Produto não encontrado",
                "O produto solicitado não existe ou não está mais disponível."
            );

            return;
        }

        showError(
            "Não foi possível carregar o produto",
            "Verifique sua conexão com o servidor e tente novamente.",
            true
        );

    } finally {
        isLoading = false;
    }
}

// ==========================================
// Inicialização
// ==========================================

function initializeEvents() {
    messageElements.retryButton.addEventListener("click", () => {
        loadProduct();
    });
}

function initializeProduct() {
    const params = new URLSearchParams(window.location.search);

    currentProductId = params.get("id");

    initializeEvents();

    if (!currentProductId || !/^[1-9]\d*$/.test(currentProductId)) {
        showError(
            "Produto inválido",
            "O identificador informado não é válido."
        );

        return;
    }

    loadProduct();
}

// ==========================================
// Inicialização da aplicação
// ==========================================

initializeProduct();
