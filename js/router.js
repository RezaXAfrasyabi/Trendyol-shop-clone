// Router
const Router = {
    currentPath: '/',
    
    init() {
        // Handle initial load
        this.handleRoute();
        
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    this.navigate(href);
                }
            }
        });
    },

    navigate(path) {
        if (path !== this.currentPath) {
            this.currentPath = path;
            window.history.pushState({}, '', path);
            this.handleRoute();
        }
    },

    async handleRoute() {
        const path = window.location.pathname;
        this.currentPath = path;
        
        const app = document.getElementById('app');
        if (!app) return;

        // Show loading
        app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            let html = '';
            
            if (path === '/' || path === '/index.html') {
                html = await this.renderProducts();
            } else if (path.startsWith('/product/')) {
                const id = path.split('/product/')[1];
                html = await this.renderProductDetail(id);
            } else if (path === '/cart') {
                html = await this.renderCart();
            } else if (path === '/checkout') {
                html = await this.renderCheckout();
            } else if (path === '/order-success') {
                html = await this.renderOrderSuccess();
            } else if (path === '/admin') {
                html = await this.renderAdminLogin();
            } else if (path === '/admin/dashboard') {
                html = await this.renderAdminDashboard();
            } else {
                html = await this.renderNotFound();
            }
            
            app.innerHTML = html;
            
            // Re-initialize any page-specific functionality
            this.initPageScripts(path);
        } catch (error) {
            console.error('Route error:', error);
            app.innerHTML = `<div class="error">Error loading page: ${error.message}</div>`;
        }
    },

    async initPageScripts(path) {
        if (path === '/checkout') {
            this.initCheckout();
        } else if (path === '/admin') {
            this.initAdminLogin();
        } else if (path === '/admin/dashboard') {
            this.initAdminDashboard();
        }
    },

    async renderProducts() {
        try {
            const products = await API.getProducts();

            if (!products || products.length === 0) {
                return `
                    <div class="container">
                        <div class="page-header">
                            <h1>Shop All Products</h1>
                            <p class="subtitle">Discover our amazing collection</p>
                        </div>
                        <div class="empty-state">
                            <p>No products available yet</p>
                        </div>
                    </div>
                `;
            }

            const productsHtml = products.map(product => `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-image">
                        ${product.image_url 
                            ? `<img src="${product.image_url}" alt="${product.name}" />`
                            : '<div class="no-image">No image</div>'
                        }
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="product-price">$${Number(product.price).toFixed(2)}</p>
                        ${product.stock < 10 && product.stock > 0 
                            ? `<p class="stock-warning">Only ${product.stock} left!</p>`
                            : ''
                        }
                        ${product.stock === 0 
                            ? '<p class="out-of-stock">Out of stock</p>'
                            : ''
                        }
                    </div>
                    <button class="btn btn-primary add-to-cart-btn" 
                            data-product-id="${product.id}"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Add to Cart
                    </button>
                </div>
            `).join('');

            return `
                <div class="container">
                    <div class="page-header">
                        <h1>Shop All Products</h1>
                        <p class="subtitle">Discover our amazing collection</p>
                    </div>
                    <div class="products-grid">
                        ${productsHtml}
                    </div>
                </div>
            `;
        } catch (error) {
            return `<div class="error">Error loading products: ${error.message}</div>`;
        }
    },

    async renderProductDetail(id) {
        try {
            const product = await API.getProduct(id);
            
            if (!product) {
                return '<div class="error">Product not found</div>';
            }

            return `
                <div class="container">
                    <a href="/" class="back-link" data-link>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Products
                    </a>
                    <div class="product-detail">
                        <div class="product-detail-image">
                            ${product.image_url 
                                ? `<img src="${product.image_url}" alt="${product.name}" />`
                                : '<div class="no-image">No image</div>'
                            }
                        </div>
                        <div class="product-detail-info">
                            <h1>${product.name}</h1>
                            <p class="product-price">$${Number(product.price).toFixed(2)}</p>
                            ${product.description 
                                ? `<div class="product-description">
                                    <h2>Description</h2>
                                    <p>${product.description}</p>
                                   </div>`
                                : ''
                            }
                            <div class="product-availability">
                                <p>Availability: 
                                    <span class="${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                                        ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                    </span>
                                </p>
                            </div>
                            <button class="btn btn-primary btn-lg add-to-cart-detail-btn" 
                                    data-product-id="${product.id}"
                                    ${product.stock === 0 ? 'disabled' : ''}>
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return `<div class="error">Error loading product: ${error.message}</div>`;
        }
    },

    async renderCart() {
        if (Cart.items.length === 0) {
            return `
                <div class="container">
                    <div class="empty-cart">
                        <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <h2>Your cart is empty</h2>
                        <p>Add some products to get started</p>
                        <a href="/" class="btn btn-primary" data-link>Continue Shopping</a>
                    </div>
                </div>
            `;
        }

        const itemsHtml = Cart.items.map(item => `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-image">
                    ${item.image_url 
                        ? `<img src="${item.image_url}" alt="${item.name}" />`
                        : '<div class="no-image-small">No image</div>'
                    }
                </div>
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="btn-icon quantity-btn" data-action="decrease" data-item-id="${item.id}">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="btn-icon quantity-btn" data-action="increase" data-item-id="${item.id}" 
                                    ${item.quantity >= item.stock ? 'disabled' : ''}>
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                        <button class="btn-icon remove-btn" data-item-id="${item.id}">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const totalPrice = Cart.getTotalPrice();

        return `
            <div class="container">
                <h1 class="page-title">Shopping Cart</h1>
                <div class="cart-layout">
                    <div class="cart-items">
                        ${itemsHtml}
                    </div>
                    <div class="cart-summary">
                        <h2>Order Summary</h2>
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>$${totalPrice.toFixed(2)}</span>
                        </div>
                        <div class="summary-total">
                            <span>Total</span>
                            <span>$${totalPrice.toFixed(2)}</span>
                        </div>
                        <a href="/checkout" class="btn btn-primary btn-lg" data-link>Proceed to Checkout</a>
                    </div>
                </div>
            </div>
        `;
    },

    async renderCheckout() {
        if (Cart.items.length === 0) {
            Router.navigate('/cart');
            return '';
        }

        const itemsHtml = Cart.items.map(item => `
            <div class="checkout-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        const totalPrice = Cart.getTotalPrice();

        return `
            <div class="container">
                <h1 class="page-title">Checkout</h1>
                <div class="checkout-layout">
                    <div class="checkout-form-container">
                        <form id="checkout-form" class="checkout-form">
                            <div class="form-section">
                                <h2>Shipping Information</h2>
                                <div class="form-group">
                                    <label for="name">Full Name</label>
                                    <input type="text" id="name" name="name" required />
                                </div>
                                <div class="form-group">
                                    <label for="phone">Phone Number</label>
                                    <input type="tel" id="phone" name="phone" required />
                                </div>
                                <div class="form-group">
                                    <label for="address">Shipping Address</label>
                                    <input type="text" id="address" name="address" required />
                                </div>
                            </div>
                            <div class="form-section">
                                <h2>Payment Method</h2>
                                <div class="radio-group">
                                    <label class="radio-label">
                                        <input type="radio" name="paymentMethod" value="cash_on_delivery" checked />
                                        <span>Cash on Delivery</span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="paymentMethod" value="online" />
                                        <span>Online Payment</span>
                                    </label>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-lg" id="submit-order-btn">
                                Place Order
                            </button>
                        </form>
                    </div>
                    <div class="checkout-summary">
                        <h2>Order Summary</h2>
                        ${itemsHtml}
                        <div class="summary-total">
                            <span>Total</span>
                            <span>$${totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderOrderSuccess() {
        return `
            <div class="container">
                <div class="success-page">
                    <svg class="icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h1>Order Placed Successfully!</h1>
                    <p>Thank you for your order. We'll contact you soon to confirm delivery details.</p>
                    <a href="/" class="btn btn-primary btn-lg" data-link>Continue Shopping</a>
                </div>
            </div>
        `;
    },

    renderAdminLogin() {
        return `
            <div class="admin-login-container">
                <div class="admin-login-card">
                    <div class="admin-login-header">
                        <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <h2>Admin Login</h2>
                    </div>
                    <form id="admin-login-form" class="admin-login-form">
                        <div class="form-group">
                            <label for="admin-email">Email</label>
                            <input type="email" id="admin-email" name="email" required />
                        </div>
                        <div class="form-group">
                            <label for="admin-password">Password</label>
                            <input type="password" id="admin-password" name="password" required />
                        </div>
                        <button type="submit" class="btn btn-primary" id="admin-login-btn">Login</button>
                    </form>
                    <a href="/" class="back-to-store" data-link>Back to Store</a>
                </div>
            </div>
        `;
    },

    async renderAdminDashboard() {
        // Check admin access
        try {
            const auth = await API.checkAuth();
            if (!auth.isAdmin) {
                Router.navigate('/admin');
                return '';
            }
        } catch (error) {
            Router.navigate('/admin');
            return '';
        }

        return `
            <div class="admin-dashboard">
                <div class="admin-header">
                    <div class="container">
                        <div class="admin-header-content">
                            <div class="admin-title">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <h1>Admin Dashboard</h1>
                            </div>
                            <div class="admin-actions">
                                <a href="/" class="btn btn-outline" data-link>View Store</a>
                                <button class="btn btn-ghost" id="admin-logout-btn">
                                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="container">
                    <div class="admin-tabs">
                        <button class="tab-btn active" data-tab="products">Products</button>
                        <button class="tab-btn" data-tab="orders">Orders</button>
                    </div>
                    <div id="admin-content" class="admin-content">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    },

    renderNotFound() {
        return `
            <div class="not-found">
                <h1>404</h1>
                <p>Oops! Page not found</p>
                <a href="/" class="link" data-link>Return to Home</a>
            </div>
        `;
    },

    initCheckout() {
        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('submit-order-btn');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';

                try {
                    const formData = new FormData(form);
                    const data = {
                        name: formData.get('name'),
                        phone: formData.get('phone'),
                        address: formData.get('address'),
                        paymentMethod: formData.get('paymentMethod'),
                    };

                    if (!data.name || !data.phone || !data.address) {
                        Cart.showToast('Please fill in all fields', 'error');
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                        return;
                    }

                    // Create order with items
                    const orderData = {
                        customer_name: data.name,
                        customer_phone: data.phone,
                        customer_address: data.address,
                        payment_method: data.paymentMethod,
                        total_price: Cart.getTotalPrice(),
                        items: Cart.items.map(item => ({
                            product_id: item.id,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    };

                    await API.createOrder(orderData);

                    Cart.clearCart();
                    Cart.showToast('Order placed successfully!', 'success');
                    Router.navigate('/order-success');
                } catch (error) {
                    console.error('Checkout error:', error);
                    Cart.showToast('Failed to place order. Please try again.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }
    },

    initAdminLogin() {
        const form = document.getElementById('admin-login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('admin-login-btn');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';

                try {
                    const formData = new FormData(form);
                    const response = await API.login(
                        formData.get('email'),
                        formData.get('password')
                    );

                    if (!response.isAdmin) {
                        await API.logout();
                        Cart.showToast('You don\'t have admin access', 'error');
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                        return;
                    }

                    Cart.showToast('Login successful!', 'success');
                    Router.navigate('/admin/dashboard');
                } catch (error) {
                    Cart.showToast(error.message || 'Login failed', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }
    },

    async initAdminDashboard() {
        // Handle logout
        const logoutBtn = document.getElementById('admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await API.logout();
                Cart.showToast('Logged out successfully', 'success');
                Router.navigate('/');
            });
        }

        // Handle tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                Router.loadAdminTab(tab);
            });
        });

        // Load initial tab
        Router.loadAdminTab('products');
    },

    async loadAdminTab(tab) {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        if (tab === 'products') {
            content.innerHTML = await this.renderAdminProducts();
            this.initAdminProducts();
        } else if (tab === 'orders') {
            content.innerHTML = await this.renderAdminOrders();
            this.initAdminOrders();
        }
    },

    async renderAdminProducts() {
        try {
            const products = await API.getProducts();

            const productsHtml = (products || []).map(product => `
                <tr>
                    <td>${product.name}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon edit-product-btn" data-product-id="${product.id}">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon delete-product-btn" data-product-id="${product.id}">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            return `
                <div class="admin-section">
                    <div class="admin-section-header">
                        <h2>Products</h2>
                        <button class="btn btn-primary" id="add-product-btn">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Product
                        </button>
                    </div>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${this.renderProductDialog()}
            `;
        } catch (error) {
            return `<div class="error">Error loading products: ${error.message}</div>`;
        }
    },

    renderProductDialog() {
        return `
            <div id="product-dialog" class="dialog">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3 id="dialog-title">Add New Product</h3>
                        <button class="dialog-close" id="dialog-close">&times;</button>
                    </div>
                    <form id="product-form" class="dialog-form">
                        <div class="form-group">
                            <label for="product-name">Name</label>
                            <input type="text" id="product-name" required />
                        </div>
                        <div class="form-group">
                            <label for="product-description">Description</label>
                            <textarea id="product-description"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="product-price">Price</label>
                            <input type="number" id="product-price" step="0.01" required />
                        </div>
                        <div class="form-group">
                            <label for="product-image-url">Image URL</label>
                            <input type="url" id="product-image-url" />
                        </div>
                        <div class="form-group">
                            <label for="product-stock">Stock</label>
                            <input type="number" id="product-stock" required />
                        </div>
                        <button type="submit" class="btn btn-primary">Save Product</button>
                    </form>
                </div>
            </div>
        `;
    },

    initAdminProducts() {
        let editingProductId = null;

        // Add product button
        const addBtn = document.getElementById('add-product-btn');
        const dialog = document.getElementById('product-dialog');
        const dialogClose = document.getElementById('dialog-close');
        const form = document.getElementById('product-form');

        if (addBtn && dialog) {
            addBtn.addEventListener('click', () => {
                editingProductId = null;
                document.getElementById('dialog-title').textContent = 'Add New Product';
                form.reset();
                dialog.classList.add('show');
            });
        }

        if (dialogClose) {
            dialogClose.addEventListener('click', () => {
                dialog.classList.remove('show');
            });
        }

        if (dialog) {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.classList.remove('show');
                }
            });
        }

        // Edit buttons
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const productId = btn.dataset.productId;

                try {
                    const product = await API.getProduct(productId);

                    editingProductId = productId;
                    document.getElementById('dialog-title').textContent = 'Edit Product';
                    document.getElementById('product-name').value = product.name;
                    document.getElementById('product-description').value = product.description || '';
                    document.getElementById('product-price').value = product.price;
                    document.getElementById('product-image-url').value = product.image_url || '';
                    document.getElementById('product-stock').value = product.stock;
                    dialog.classList.add('show');
                } catch (error) {
                    Cart.showToast('Error loading product', 'error');
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete this product?')) return;

                const productId = btn.dataset.productId;

                try {
                    await API.deleteProduct(productId);

                    Cart.showToast('Product deleted', 'success');
                    Router.loadAdminTab('products');
                } catch (error) {
                    Cart.showToast('Error deleting product', 'error');
                }
            });
        });

        // Form submit
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const data = {
                    name: document.getElementById('product-name').value,
                    description: document.getElementById('product-description').value || null,
                    price: parseFloat(document.getElementById('product-price').value),
                    image_url: document.getElementById('product-image-url').value || null,
                    stock: parseInt(document.getElementById('product-stock').value),
                };

                try {
                    if (editingProductId) {
                        await API.updateProduct(editingProductId, data);
                        Cart.showToast('Product updated', 'success');
                    } else {
                        await API.createProduct(data);
                        Cart.showToast('Product added', 'success');
                    }

                    dialog.classList.remove('show');
                    Router.loadAdminTab('products');
                } catch (error) {
                    Cart.showToast(error.message, 'error');
                }
            });
        }
    },

    async renderAdminOrders() {
        try {
            const orders = await API.getOrders();

            const ordersHtml = (orders || []).map(order => {
                const date = new Date(order.created_at);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });

                return `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${order.customer_name}</td>
                        <td>${order.customer_phone}</td>
                        <td>$${order.total_price.toFixed(2)}</td>
                        <td class="capitalize">${order.payment_method.replace('_', ' ')}</td>
                        <td>
                            <select class="status-select" data-order-id="${order.id}">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="admin-section">
                    <h2>Orders</h2>
                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ordersHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            return `<div class="error">Error loading orders: ${error.message}</div>`;
        }
    },

    initAdminOrders() {
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async () => {
                const orderId = select.dataset.orderId;
                const status = select.value;

                try {
                    await API.updateOrderStatus(orderId, status);

                    Cart.showToast('Order status updated', 'success');
                } catch (error) {
                    Cart.showToast(error.message, 'error');
                    // Revert selection
                    Router.loadAdminTab('orders');
                }
            });
        });
    }
};

