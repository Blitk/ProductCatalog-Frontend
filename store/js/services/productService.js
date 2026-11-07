
import { api } from "../../../shared/js/api.js";

export const productService = {

    async getProducts(params = {}) {
        const query = new URLSearchParams();

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== "") {
                query.append(key, value);
            }
        }

        return api.get(`/products?${query.toString()}`);
    },

    async getProductById(id) {
        return api.get(`/products/${id}`);
    },

    async getCategories() {
        return api.get("/categories");
    },

    async filterProducts(params = {}) {
        const query = new URLSearchParams();

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== "") {
                query.append(key, value);
            }
        }

        return api.get(`/products/filter?${query.toString()}`);
    }
};
