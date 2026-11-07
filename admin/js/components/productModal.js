
import { productService } from "../services/productService.js";
import { categoryService } from "../services/categoryService.js";
import { API_SERVER_URL } from "../../../shared/js/config.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const elements = {
    modal: document.getElementById("product-modal"),
    title: document.getElementById("product-modal-title"),
    description: document.getElementById("product-modal-description"),
    closeButton: document.getElementById("close-product-modal"),
    form: document.getElementById("product-form"),

    name: document.getElementById("product-name"),
    productDescription: document.getElementById("product-description"),
    price: document.getElementById("product-price"),
    stock: document.getElementById("product-stock"),
    category: document.getElementById("product-category"),

    imageFile: document.getElementById("product-image-file"),
    previewContainer: document.getElementById("image-preview-container"),
    preview: document.getElementById("product-image-preview"),
    removeImageButton: document.getElementById("remove-product-image"),
    currentImageMessage: document.getElementById("current-image-message"),

    error: document.getElementById("product-form-error"),
    cancelButton: document.getElementById("cancel-product-form"),
    saveButton: document.getElementById("save-product-button")
};

const state = {
    editingId: null,
    currentImageUrl: null,
    removeCurrentImage: false,
    isSaving: false,
    categoriesLoaded: false,
    categoriesPromise: null,
    onSaved: null,
    previousFocus: null
};

// ================================
// UTILITIES
// ================================

function showError(message) {
    elements.error.textContent = message;
    elements.error.hidden = false;
}

function hideError() {
    elements.error.textContent = "";
    elements.error.hidden = true;
}

function getImageUrl(imageUrl) {
    if (!imageUrl) {
        return "";
    }

    if (/^https?:\/\//i.test(imageUrl)) {
        return imageUrl;
    }

    return `${API_SERVER_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function validateImage(file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return "Formato inválido. Utilize PNG, JPEG ou WebP.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return "A imagem deve ter no máximo 5 MB.";
    }

    return null;
}

// ================================
// FORM STATE
// ================================

function setSaving(saving) {
    state.isSaving = saving;

    elements.saveButton.disabled = saving;
    elements.cancelButton.disabled = saving;
    elements.closeButton.disabled = saving;

    elements.saveButton.textContent = saving
        ? "Salvando..."
        : "Salvar produto";
}

function resetImage() {
    elements.imageFile.value = "";
    elements.preview.removeAttribute("src");
    elements.previewContainer.hidden = true;

    elements.currentImageMessage.textContent = "";
    elements.currentImageMessage.hidden = true;

    state.currentImageUrl = null;
    state.removeCurrentImage = false;
}

function resetForm() {
    elements.form.reset();

    hideError();
    resetImage();

    state.editingId = null;

    elements.title.textContent = "Adicionar produto";

    elements.description.textContent =
        "Preencha os dados para cadastrar um novo produto.";

    elements.saveButton.textContent = "Salvar produto";
}

function getFormData() {
    return {
        name: elements.name.value.trim(),
        description: elements.productDescription.value.trim(),
        price: Number(elements.price.value),
        stockQuantity: Number(elements.stock.value),
        categoryId: Number(elements.category.value)
    };
}

// ================================
// VALIDATION
// ================================

function validateForm(product) {
    if (!product.name) {
        return "Informe o nome do produto.";
    }

    if (!Number.isFinite(product.price) || product.price <= 0) {
        return "Informe um preço maior que zero.";
    }

    if (
        !Number.isInteger(product.stockQuantity) ||
        product.stockQuantity < 0
    ) {
        return "O estoque deve ser um número inteiro igual ou maior que zero.";
    }

    if (!Number.isInteger(product.categoryId) || product.categoryId <= 0) {
        return "Selecione uma categoria válida.";
    }

    const file = elements.imageFile.files[0];

    if (file) {
        return validateImage(file);
    }

    return null;
}

// ================================
// CATEGORIES
// ================================

async function loadCategories() {
    if (state.categoriesLoaded) {
        return;
    }

    if (state.categoriesPromise) {
        return state.categoriesPromise;
    }

    state.categoriesPromise = (async () => {
        const response = await categoryService.getCategories();

        const categories = Array.isArray(response)
            ? response
            : response.content || [];

        elements.category.innerHTML = `
            <option value="">Selecione uma categoria</option>
        `;

        categories.forEach(category => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            elements.category.appendChild(option);
        });

        state.categoriesLoaded = true;
    })();

    try {
        await state.categoriesPromise;
    } finally {
        state.categoriesPromise = null;
    }
}

// ================================
// IMAGE PREVIEW
// ================================

function showImagePreview(imageUrl) {
    elements.preview.src = imageUrl;
    elements.previewContainer.hidden = false;
}

function populateForm(product) {
    elements.name.value = product.name ?? "";
    elements.productDescription.value = product.description ?? "";
    elements.price.value = product.price ?? "";
    elements.stock.value = product.stockQuantity ?? "";

    const categoryId = product.category?.id ?? product.categoryId ?? "";

    elements.category.value = categoryId;

    if (product.imageUrl) {
        state.currentImageUrl = product.imageUrl;

        showImagePreview(getImageUrl(product.imageUrl));

        elements.currentImageMessage.textContent =
            "Imagem atual do produto.";

        elements.currentImageMessage.hidden = false;
    }
}

function handleImageSelection() {
    const file = elements.imageFile.files[0];

    if (!file) {
        return;
    }

    const validationError = validateImage(file);

    if (validationError) {
        showError(validationError);
        elements.imageFile.value = "";
        return;
    }

    hideError();

    state.removeCurrentImage = false;

    const reader = new FileReader();

    reader.onload = () => {
        if (typeof reader.result !== "string") {
            showError("Não foi possível visualizar a imagem.");
            return;
        }

        showImagePreview(reader.result);

        elements.currentImageMessage.textContent =
            "Nova imagem selecionada.";

        elements.currentImageMessage.hidden = false;
    };

    reader.onerror = () => {
        showError("Não foi possível visualizar a imagem selecionada.");
    };

    reader.readAsDataURL(file);
}

function handleRemoveImage() {
    elements.imageFile.value = "";

    if (state.currentImageUrl) {
        state.removeCurrentImage = true;

        elements.previewContainer.hidden = true;

        elements.currentImageMessage.textContent =
            "A imagem atual será removida ao salvar.";

        elements.currentImageMessage.hidden = false;
    } else {
        resetImage();
    }

    hideError();
}

// ================================
// MODAL
// ================================

function openModal() {
    state.previousFocus = document.activeElement;

    elements.modal.hidden = false;
    document.body.style.overflow = "hidden";

    elements.name.focus();
}

function closeModal(force = false) {
    if (state.isSaving && !force) {
        return;
    }

    elements.modal.hidden = true;
    document.body.style.overflow = "";

    resetForm();

    if (state.previousFocus instanceof HTMLElement) {
        state.previousFocus.focus();
    }

    state.previousFocus = null;
}

// ================================
// CREATE
// ================================

async function openCreate() {
    if (state.isSaving) {
        return;
    }

    resetForm();

    try {
        await loadCategories();

        openModal();
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);

        alert("Não foi possível carregar as categorias.");
    }
}

// ================================
// EDIT
// ================================

async function openEdit(id) {
    if (state.isSaving) {
        return;
    }

    resetForm();

    try {
        await loadCategories();

        const product = await productService.getProductById(id);

        state.editingId = product.id;

        elements.title.textContent = "Editar produto";

        elements.description.textContent =
            "Altere os dados do produto e salve as modificações.";

        populateForm(product);

        openModal();
    } catch (error) {
        console.error("Erro ao carregar produto:", error);

        alert(`Não foi possível carregar o produto: ${error.message}`);
    }
}

// ================================
// SAVE
// ================================

async function handleSubmit(event) {
    event.preventDefault();

    if (state.isSaving) {
        return;
    }

    hideError();

    const product = getFormData();
    const validationError = validateForm(product);

    if (validationError) {
        showError(validationError);
        return;
    }

    const selectedFile = elements.imageFile.files[0];

    setSaving(true);

    try {
        let savedProduct;

        if (state.editingId !== null) {
            savedProduct = await productService.updateProduct(
                state.editingId,
                product
            );
        } else {
            savedProduct = await productService.createProduct(product);
        }

        const productId = savedProduct?.id ?? state.editingId;

        if (!productId) {
            throw new Error(
                "A API não retornou o ID do produto salvo."
            );
        }

        // Envia uma nova imagem, se selecionada.
        if (selectedFile) {
            try {
                await productService.uploadImage(productId, selectedFile);
            } catch (error) {
                await refreshProducts();

                showError(
                    `Produto salvo, mas houve um erro no envio da imagem: ${error.message}`
                );

                state.editingId = productId;
                return;
            }
        }

        // Remove a imagem atual, se solicitado.
        else if (state.removeCurrentImage && state.currentImageUrl) {
            try {
                await productService.deleteImage(productId);
            } catch (error) {
                await refreshProducts();

                showError(
                    `Produto salvo, mas não foi possível remover a imagem: ${error.message}`
                );

                state.editingId = productId;
                return;
            }
        }

        await refreshProducts();

        closeModal(true);

    } catch (error) {
        console.error("Erro ao salvar produto:", error);

        showError(
            `Não foi possível salvar o produto: ${error.message}`
        );
    } finally {
        setSaving(false);
    }
}

async function refreshProducts() {
    if (typeof state.onSaved === "function") {
        await state.onSaved();
    }
}

// ================================
// EVENTS
// ================================

function initializeEvents() {
    elements.form.addEventListener("submit", handleSubmit);

    elements.closeButton.addEventListener("click", () => closeModal());

    elements.cancelButton.addEventListener("click", () => closeModal());

    elements.imageFile.addEventListener("change", handleImageSelection);

    elements.removeImageButton.addEventListener("click", handleRemoveImage);

    elements.modal.addEventListener("click", event => {
        if (event.target === elements.modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (elements.modal.hidden) {
            return;
        }

        if (event.key === "Escape") {
            closeModal();
        }
    });
}

// ================================
// PUBLIC API
// ================================

export function initializeProductModal({ onSaved } = {}) {
    state.onSaved = onSaved ?? null;

    initializeEvents();

    return {
        openCreate,
        openEdit
    };
}
