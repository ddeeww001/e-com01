function loadProducts() {
    const container = document.querySelector('#product-grid');
    if (!container) return;

    fetch('http://localhost:3000/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            if (!products || products.length === 0) return;

            const productsHTML = products.map(product => {
                const badgeHTML = product.badge 
                    ? `<span class="${product.badgeClass || 'sale'}">${product.badge}</span>` 
                    : '';

                const priceHTML = product.originalPrice
                    ? `<p class="mb-0"><span class="price price-sale">$${product.originalPrice.toFixed(2)}</span> <span class="price">$${product.price.toFixed(2)}</span></p>`
                    : `<p class="mb-0"><span class="price">$${product.price.toFixed(2)}</span></p>`;

                return `
                    <div class="col-md-4 d-flex">
                        <div class="product ftco-animate fadeInUp ftco-animated">
                            <div class="img d-flex align-items-center justify-content-center" style="background-image: url(${product.imageUrl});">
                                <div class="desc">
                                    <p class="meta-prod d-flex">
                                        <a href="#" class="add-to-cart d-flex align-items-center justify-content-center" data-id="${product.id}"><span class="flaticon-shopping-bag"></span></a>
                                        <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-heart"></span></a>
                                        <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-visibility"></span></a>
                                    </p>
                                </div>
                            </div>
                            <div class="text text-center">
                                ${badgeHTML}
                                <span class="category">${product.category}</span>
                                <h2>${product.title}</h2>
                                ${priceHTML}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = productsHTML;
        })
        .catch(error => {
            console.error('Error fetching product data:', error);
        });
}

document.addEventListener('DOMContentLoaded', loadProducts);