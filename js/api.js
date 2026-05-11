// API Client - Replaces Supabase
const API = {
    baseURL: CONFIG.API_URL,
    token: null,

    init() {
        // Load token from localStorage
        this.token = localStorage.getItem('admin_token');
    },

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add auth token if available
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },

    // Products
    async getProducts() {
        return this.request('/products');
    },

    async getProduct(id) {
        return this.request(`/products/${id}`);
    },

    async createProduct(data) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProduct(id, data) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE',
        });
    },

    // Orders
    async getOrders() {
        return this.request('/orders');
    },

    async createOrder(data) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateOrderStatus(id, status) {
        return this.request(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    // Auth
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('admin_token', response.token);
        }
        
        return response;
    },

    async logout() {
        this.token = null;
        localStorage.removeItem('admin_token');
    },

    async checkAuth() {
        if (!this.token) {
            return { user: null, isAdmin: false };
        }
        
        try {
            return await this.request('/auth/me');
        } catch (error) {
            this.logout();
            return { user: null, isAdmin: false };
        }
    },
};

// Initialize API on load
document.addEventListener('DOMContentLoaded', () => {
    API.init();
});

