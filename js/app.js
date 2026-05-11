// Main App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Router
    if (Router && Router.init) {
        Router.init();
    }

    // Setup product card click handlers
    setupProductHandlers();

    // Setup cart handlers
    setupCartHandlers();
});

function setupProductHandlers() {
    // Delegate event handling for dynamically loaded content
    document.addEventListener('click', (e) => {
        // Product card click (navigate to detail)
        const productCard = e.target.closest('.product-card');
        if (productCard && !e.target.closest('.add-to-cart-btn')) {
            const productId = productCard.dataset.productId;
            if (productId) {
                Router.navigate(`/product/${productId}`);
            }
        }

        // Add to cart from product list
        const addToCartBtn = e.target.closest('.add-to-cart-btn');
        if (addToCartBtn) {
            e.stopPropagation();
            const productId = addToCartBtn.dataset.productId;
            if (productId) {
                loadProductAndAddToCart(productId);
            }
        }

        // Add to cart from product detail
        const addToCartDetailBtn = e.target.closest('.add-to-cart-detail-btn');
        if (addToCartDetailBtn) {
            const productId = addToCartDetailBtn.dataset.productId;
            if (productId) {
                loadProductAndAddToCart(productId);
            }
        }
    });
}

async function loadProductAndAddToCart(productId) {
    try {
        const product = await API.getProduct(productId);

        Cart.addToCart({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image_url: product.image_url || undefined,
            stock: product.stock,
        });
    } catch (error) {
        Cart.showToast('Error adding product to cart', 'error');
    }
}

function setupCartHandlers() {
    document.addEventListener('click', (e) => {
        // Quantity controls
        const quantityBtn = e.target.closest('.quantity-btn');
        if (quantityBtn) {
            const action = quantityBtn.dataset.action;
            const itemId = quantityBtn.dataset.itemId;
            const item = Cart.items.find(i => i.id === itemId);
            
            if (item) {
                if (action === 'increase') {
                    Cart.updateQuantity(itemId, item.quantity + 1);
                } else if (action === 'decrease') {
                    Cart.updateQuantity(itemId, item.quantity - 1);
                }
                
                // Re-render cart
                Router.handleRoute();
            }
        }

        // Remove item
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const itemId = removeBtn.dataset.itemId;
            Cart.removeFromCart(itemId);
            Router.handleRoute();
        }
    });
}

