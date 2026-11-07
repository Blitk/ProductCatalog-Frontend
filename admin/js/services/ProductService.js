
import { api } from "../../../shared/js/api.js";

function buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.append(key, value);
        }
    });

    return query.toString();
}

export const productService = {

    async getProducts(params = {}) {
        return api.get(`/products?${buildQuery(params)}`);
    },

    async filterProducts(params = {}) {
        return api.get(`/products/filter?${buildQuery(params)}`);
    },

    async getProductById(id) {
        return api.get(`/products/${id}`);
    },

    async createProduct(product) {
        return api.post("/products", product);
    },

    async updateProduct(id, product) {
        return api.put(`/products/${id}`, product);
    },

    async deleteProduct(id) {
        return api.delete(`/products/${id}`);
    },

    async uploadImage(id, file) {
        const formData = new FormData();
        formData.append("file", file);

        return api.postMultipart(`/products/${id}/image`, formData);
    },

    async deleteImage(id) {
        return api.delete(`/products/${id}/image`);
    }

};
