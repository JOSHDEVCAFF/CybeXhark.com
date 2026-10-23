let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Sample products
const products = [
    {
        title: "Lifting Wrist Straps",
        price: 20.99,
        description: "Premium lifting wrist straps designed for weightlifting and powerlifting.",
        image: "straps.jpg"
    },
    {
        title: "Jet Black Lever Belt",
        price: 50.99,
        description: "Heavy-duty lever weightlifting belt for maximum support.",
        image: "belt.jpg"
    },
    {
        title: "Splay Nylon Speed Rope",
        price: 12.99,
        description: "High-quality nylon speed rope, perfect for fast workouts.",
        image: "Splay Nylon Speed Rope 10 Foot - Purple _ 10 Foot.jpg"
    },
    {
        title: "Whey Protein Powder",
        price: 55.00,
        description: "100% Whey Protein Powder for muscle recovery and growth.",
        image: "Whey Protein.jpg"
    },
    {
        title: "Euphoria Pre-Workout",
        price: 59.99,
        description: "Euphoria pre-workout for maximum energy and focus.",
        image: "euphoria.jpg"
    },
    {
        title: "Creatine Monohydrate",
        price: 69.99,
        description: "Creatine Monohydrate for Boost/Fast Muscle Growth and Recovery, Enhance Strength and Power.",
        image: "creatine.jpg"
    },
    {
        title: "Dumbbell 10kg",
        price: 20.99,
        description: "High-quality 10kg dumbbell for strength training.",
        image: "dumbell.jpeg"
    },
    {
        title: "Compression T-shirt",
        price: 25.99,
        description: "Compression T-shirt for enhanced performance during workouts.",
        image: "david.jpg"
    },
    {
        title: "Bench Press Machine",
        price: 1099.99,
        description: "Bench press machine for effective upper body workouts.",
        image: "Bench.jpg"
    },
    {
        title: "Shoulder Press Machine",
        price: 1199.99,
        description: "Shoulder press machine for effective shoulder workouts.",
        image: "shoulder.jpg"
    },
    {
        title: "Squat Rack",
        price: 999.99,
        description: "Squat rack for effective leg workouts.",
        image: "Squat.jpg"
    },
    {
        title: "Lat Pulldown Machine",
        price: 1399.99,
        description: "Lat pulldown machine for effective back workouts.",
        image: "Lats.jpg"
    }
];

const addToCartButtons = document.querySelectorAll('.add-to-cart');

function addProductToCart(index) {
    const product = products[index];
    if (!product) {
        return;
    }

    const existingProduct = cart.find(item => item.title === product.title);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    const cartBadge = document.getElementById('cart-count');
    cartBadge.classList.add('bounce');
    setTimeout(() => cartBadge.classList.remove('bounce'), 500);
}

addToCartButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        if (!localStorage.getItem('loggedInUser')) {
            sessionStorage.setItem('pendingCartProduct', String(index));
            window.location.href = 'login.html?returnTo=shop.html';
            return;
        }

        addProductToCart(index);
    });
});

// Filter products by category without changing their cart-button order.
const categoryFilters = document.querySelectorAll('.category-filter');
const productCards = document.querySelectorAll('.product-card');
const categoryResultCount = document.getElementById('category-result-count');

categoryFilters.forEach((filter) => {
    filter.addEventListener('click', () => {
        const selectedCategory = filter.dataset.category;
        let visibleCount = 0;

        productCards.forEach((card) => {
            const isVisible = selectedCategory === 'all' || card.dataset.category === selectedCategory;
            card.hidden = !isVisible;
            visibleCount += Number(isVisible);
        });

        categoryFilters.forEach((categoryFilter) => {
            const isActive = categoryFilter === filter;
            categoryFilter.classList.toggle('is-active', isActive);
            categoryFilter.setAttribute('aria-pressed', String(isActive));
        });

        categoryResultCount.textContent = selectedCategory === 'all'
            ? `Showing all ${visibleCount} products`
            : selectedCategory === 'equipment'
                ? `Showing ${visibleCount} gym equipment items`
                : `Showing ${visibleCount} supplements`;
    });
});

// Update Cart Count
function updateCartCount() {
    const cartCount = cart.reduce((total, product) => total + product.quantity, 0);
    document.getElementById('cart-count').textContent = cartCount;
}

// View Cart Button
document.getElementById('view-cart').addEventListener('click', () => {
    if (!localStorage.getItem('loggedInUser')) {
        window.location.href = 'login.html?returnTo=checkout.html';
        return;
    }
    window.location.href = 'checkout.html';
});

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    const pendingProduct = sessionStorage.getItem('pendingCartProduct');
    if (pendingProduct !== null) {
        sessionStorage.removeItem('pendingCartProduct');
        if (localStorage.getItem('loggedInUser')) {
            addProductToCart(Number(pendingProduct));
        }
    }
});
