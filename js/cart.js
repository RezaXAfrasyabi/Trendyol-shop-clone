// Cart Management
const Cart = {
    items: [],

    init() {
        this.loadFromStorage();
        this.updateBadge();
    },

    loadFromStorage() {
        const saved = localStorage.getItem('cart');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (e) {
                this.items = [];
            }
        }
    },

    saveToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateBadge();
    },

    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    },

    addToCart(product) {
        const existing = this.items.find(item => item.id === product.id);
        
        if (existing) {
            if (existing.quantity >= product.stock) {
                this.showToast('Cannot add more items than available in stock', 'error');
                return;
            }
            existing.quantity += 1;
            this.showToast('Item quantity updated', 'success');
        } else {
            this.items.push({ ...product, quantity: 1 });
            this.showToast('Item added to cart', 'success');
        }
        
        this.saveToStorage();
    },

    removeFromCart(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.showToast('Item removed from cart', 'success');
    },

    updateQuantity(productId, quantity) {
        if (quantity < 1) {
            this.removeFromCart(productId);
            return;
        }
        
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity > item.stock) {
                this.showToast('Cannot add more items than available in stock', 'error');
                return;
            }
            item.quantity = quantity;
            this.saveToStorage();
        }
    },

    clearCart() {
        this.items = [];
        localStorage.removeItem('cart');
        this.updateBadge();
    },

    getTotalPrice() {
        return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }
};

// Initialize cart on load
document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
});

