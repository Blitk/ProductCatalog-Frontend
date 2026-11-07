
import { categoryService } from "./services/categoryService.js";

const elements = {
    tableBody: document.getElementById("categories-table-body"),
    count: document.getElementById("categories-count"),
    error: document.getElementById("categories-error"),
    errorMessage: document.getElementById("categories-error-message"),
    retryButton: document.getElementById("categories-retry"),
    addButton: document.getElementById("add-category-button"),

    modal: document.getElementById("category-modal"),
    modalTitle: document.getElementById("category-modal-title"),
    modalDescription: document.getElementById("category-modal-description"),
    closeButton: document.getElementById("close-category-modal"),
    cancelButton: document.getElementById("cancel-category-form"),

    form: document.getElementById("category-form"),
    name: document.getElementById("category-name"),
    formError: document.getElementById("category-form-error"),
    saveButton: document.getElementById("save-category-button")
};

const state = {
    editingId: null,
    isSaving: false,
    isDeleting: false,
    requestId: 0,
    categories: [],
    previousFocus: null
};

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

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.error.hidden = false;
}

function hideError() {
    elements.errorMessage.textContent = "";
    elements.error.hidden = true;
}

function showFormError(message) {
    elements.formError.textContent = message;
    elements.formError.hidden = false;
}

function hideFormError() {
    elements.formError.textContent = "";
    elements.formError.hidden = true;
}

// =================================
// TABLE STATES
// =================================

function showLoading() {
    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="table-message">
                Carregando categorias...
            </td>
        </tr>
    `;

    elements.count.textContent = "Carregando...";
}

function renderEmpty() {
    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="table-message">
                Nenhuma categoria cadastrada.
            </td>
        </tr>
    `;

    elements.count.textContent = "0 categorias cadastradas";
}

// =================================
// TABLE RENDERING
// =================================

function renderCategories(categories) {
    if (!categories.length) {
        renderEmpty();
        return;
    }

    elements.tableBody.innerHTML = categories.map(category => `
        <tr>
            <td>${escapeHTML(category.id)}</td>

            <td>${escapeHTML(category.name)}</td>

            <td>
                <div class="product-actions">

                    <button
                        type="button"
                        class="action-button"
                        data-action="edit"
                        data-id="${escapeHTML(category.id)}"
                        aria-label="Editar categoria ${escapeHTML(category.name)}">

                        Editar

                    </button>

                    <button
                        type="button"
                        class="action-button delete-action"
                        data-action="delete"
                        data-id="${escapeHTML(category.id)}"
                        aria-label="Excluir categoria ${escapeHTML(category.name)}"
                        ${state.isDeleting ? "disabled" : ""}>

                        Excluir

                    </button>

                </div>
            </td>
        </tr>
    `).join("");

    elements.count.textContent =
        `${categories.length} categoria(s) cadastrada(s)`;
}

// =================================
// CATEGORY REQUEST
// =================================

async function loadCategories() {
    const currentRequestId = ++state.requestId;

    hideError();
    showLoading();

    try {
        const response = await categoryService.getCategories();

        if (currentRequestId !== state.requestId) {
            return;
        }

        state.categories = Array.isArray(response)
            ? response
            : response.content || [];

        renderCategories(state.categories);

    } catch (error) {
        if (currentRequestId !== state.requestId) {
            return;
        }

        console.error("Erro ao carregar categorias:", error);

        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="table-message">
                    Não foi possível carregar as categorias.
                </td>
            </tr>
        `;

        elements.count.textContent = "Erro ao carregar";

        showError(
            `Não foi possível carregar as categorias: ${error.message}`
        );
    }
}

// =================================
// FORM
// =================================

function resetForm() {
    elements.form.reset();

    hideFormError();

    state.editingId = null;

    elements.modalTitle.textContent = "Nova categoria";

    elements.modalDescription.textContent =
        "Informe o nome da categoria.";

    elements.saveButton.textContent = "Salvar categoria";
}

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

function openCreateModal() {
    if (state.isSaving) {
        return;
    }

    resetForm();
    openModal();
}

function openEditModal(id) {
    if (state.isSaving) {
        return;
    }

    const category = state.categories.find(
        item => String(item.id) === String(id)
    );

    if (!category) {
        showError("Não foi possível encontrar a categoria selecionada.");
        return;
    }

    resetForm();

    state.editingId = category.id;

    elements.modalTitle.textContent = "Editar categoria";

    elements.modalDescription.textContent =
        "Altere o nome da categoria.";

    elements.name.value = category.name;

    openModal();
}

// =================================
// SAVE
// =================================

function setSaving(saving) {
    state.isSaving = saving;

    elements.saveButton.disabled = saving;
    elements.cancelButton.disabled = saving;
    elements.closeButton.disabled = saving;

    elements.saveButton.textContent = saving
        ? "Salvando..."
        : "Salvar categoria";
}

async function handleSubmit(event) {
    event.preventDefault();

    if (state.isSaving) {
        return;
    }

    hideFormError();

    const name = elements.name.value.trim();

    if (!name) {
        showFormError("Informe o nome da categoria.");
        elements.name.focus();
        return;
    }

    setSaving(true);

    try {
        const category = { name };

        if (state.editingId !== null) {
            await categoryService.updateCategory(
                state.editingId,
                category
            );
        } else {
            await categoryService.createCategory(category);
        }

        // Atualiza a lista antes de fechar o modal.
        await loadCategories();

        // Se a atualização falhar, a categoria ainda foi salva.
        closeModal(true);

        // A atualização de filtros externos será integrada depois.

    } catch (error) {
        console.error("Erro ao salvar categoria:", error);

        showFormError(
            `Não foi possível salvar a categoria: ${error.message}`
        );
    } finally {
        setSaving(false);
    }
}

// =================================
// DELETE
// =================================

async function deleteCategory(id) {
    if (state.isDeleting) {
        return;
    }

    const category = state.categories.find(
        item => String(item.id) === String(id)
    );

    const categoryName = category?.name ?? "esta categoria";

    const confirmed = window.confirm(
        `Tem certeza de que deseja excluir "${categoryName}"?`
    );

    if (!confirmed) {
        return;
    }

    state.isDeleting = true;

    try {
        await categoryService.deleteCategory(id);

        await loadCategories();

    } catch (error) {
        console.error("Erro ao excluir categoria:", error);

        showError(
            `Não foi possível excluir a categoria: ${error.message}`
        );
    } finally {
        state.isDeleting = false;
        renderCategories(state.categories);
    }
}

// =================================
// EVENTS
// =================================

function initializeEvents() {
    elements.addButton.addEventListener("click", openCreateModal);

    elements.closeButton.addEventListener("click", () => closeModal());

    elements.cancelButton.addEventListener("click", () => closeModal());

    elements.form.addEventListener("submit", handleSubmit);

    elements.retryButton.addEventListener("click", loadCategories);

    elements.modal.addEventListener("click", event => {
        if (event.target === elements.modal) {
            closeModal();
        }
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
            openEditModal(id);
        }

        if (action === "delete") {
            deleteCategory(id);
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

// =================================
// INITIALIZATION
// =================================

export function initializeCategories() {
    initializeEvents();
    loadCategories();
}
