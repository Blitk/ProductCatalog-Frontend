
import { api } from "../../../shared/js/api.js";

export const categoryService = {

    async getCategories() {
        return api.get("/categories");
    },

    async getCategoryById(id) {
        return api.get(`/categories/${id}`);
    },

    async createCategory(category) {
        return api.post("/categories", category);
    },

    async updateCategory(id, category) {
        return api.put(`/categories/${id}`, category);
    },

    async deleteCategory(id) {
        return api.delete(`/categories/${id}`);
    }

};
