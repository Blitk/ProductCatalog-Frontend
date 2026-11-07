
import { productService } from "./services/productService.js";
import { API_SERVER_URL } from "../../shared/js/config.js";

const productMessage = document.getElementById("product-message");
const productDetails = document.getElementById("product-details");

const elements = {
    image: document.getElementById("product-image"),
    category: document.getElementById("product-category"),
    name: document.getElementById("product-name"),
    price: document.getElementById("product-price"),
    description: document.getElementById("product-description"),
    stock: document.getElementById("product-stock"),
    stockIndicator: document.getElementById("stock-indicator"),
    id: document.getElementById("product-id"),
    breadcrumb: document.getElementById("breadcrumb-product")
};

function formatPrice(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(value);
}

function showError(message) {
    productMessage.hidden = false;
    productMessage.classList.add("error");
    productMessage.textContent = message;

    productDetails.hidden = true;
}

function renderProduct(product) {
    const available = product.stockQuantity > 0;

    elements.name.textContent = product.name;
    elements.category.textContent =
        product.category?.name || "Sem categoria";

    elements.price.textContent = formatPrice(product.price);

    elements.description.textContent =
        product.description || "Nenhuma descrição disponível.";

    elements.id.textContent = product.id;
    elements.breadcrumb.textContent = product.name;

    elements.stock.textContent = available
        ? `${product.stockQuantity} unidade(s) disponível(is)`
        : "Produto indisponível";

    elements.stockIndicator.classList.toggle(
        "unavailable",
        !available
    );

    if (product.imageUrl) {
        elements.image.src = `${API_SERVER_URL}${product.imageUrl}`;
        elements.image.alt = product.name;
        elements.image.hidden = false;

        elements.image.onerror = () => {
            elements.image.hidden = true;
        };
    } else {
        elements.image.hidden = true;
    }

    productMessage.hidden = true;
    productDetails.hidden = false;

    document.title = `${product.name} | ProductCatalog`;
}

async function initializeProduct() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id || !/^[1-9]\d*$/.test(id)) {
        showError("Identificador de produto inválido.");
        return;
    }

    try {
        const product = await productService.getProductById(id);

        renderProduct(product);

    } catch (error) {
        console.error(error);

        showError(
            error.message.includes("404")
                ? "Produto não encontrado."
                : `Não foi possível carregar o produto: ${error.message}`
        );
    }
}

initializeProduct();
