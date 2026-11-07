
import { API_BASE_URL } from "./config.js";

export class ApiError extends Error {
    constructor(message, status) {
        super(message);

        this.name = "ApiError";
        this.status = status;
    }
}

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
        let message = `Erro HTTP ${response.status}`;

        try {
            const data = await response.json();

            message = data.message || message;

        } catch {
            // Mantém a mensagem HTTP padrão.
        }

        throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export const api = {

    get(endpoint) {
        return request(endpoint);
    },

    post(endpoint, body) {
        return request(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    },

    postMultipart(endpoint, formData) {
        return request(endpoint, {
            method: "POST",
            body: formData
        });
    },

    put(endpoint, body) {
        return request(endpoint, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return request(endpoint, {
            method: "DELETE"
        });
    }

};
