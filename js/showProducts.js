	function loadProducts() {
    const container = document.querySelector('#product-container');
    if (!container) return;

    // เราจะไม่ใช้ container.innerHTML = 'Loading...' แล้ว เพราะจะไปทับสินค้า Hardcode เดิม

    fetch('data/products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            const productsHTML = products.map(product => {
                
                const badgeHTML = product.badge 
                    ? `<span class="${product.badgeClass || 'sale'}" style="position: absolute; top: 10px; left: 10px; z-index: 1; padding: 5px 10px; color: #fff; background: ${product.badgeClass === 'badge-danger' ? 'red' : 'orange'};">${product.badge}</span>` 
                    : '';

                const priceHTML = product.originalPrice
                    ? `<p class="mb-0"><span class="price price-sale" style="text-decoration: line-through; color: #b3b3b3; margin-right: 10px;">฿${product.originalPrice.toLocaleString()}</span> <span class="price">฿${product.price.toLocaleString()}</span></p>`
                    : `<p class="mb-0"><span class="price">฿${product.price.toLocaleString()}</span></p>`;

                return `
                    <div class="col-md-3 d-flex mb-4">
                        <div class="product w-100 position-relative">
                            ${badgeHTML}
                            <div class="img d-flex align-items-center justify-content-center" style="background-image: url(${product.imageUrl}); height: 300px; background-size: cover; background-position: center;">
                                <div class="desc">
                                    <p class="meta-prod d-flex">
                                        <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-shopping-bag"></span></a>
                                        <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-heart"></span></a>
                                        <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-visibility"></span></a>
                                    </p>
                                </div>
                            </div>
                            <div class="text text-center pt-3 mt-3">
                                <span class="category">${product.category}</span>
                                <h2>${product.title}</h2>
                                ${priceHTML}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // *** จุดที่แก้ไข ***
            // ใช้คำสั่ง insertAdjacentHTML แบบ 'beforeend' เพื่อนำสินค้าจาก JSON ไปต่อท้ายสินค้า Hardcode
            //container.insertAdjacentHTML('beforeend', productsHTML);
			container.innerHTML = productsHTML;
        })
        .catch(error => {
            console.error('Error fetching product data:', error);
            // ถ้าระบบ Error เราจะแทรกข้อความ Error ไว้ต่อท้ายสินค้า Hardcode แทนที่จะลบทิ้งทั้งหมด
            container.insertAdjacentHTML('beforeend', `
                <div class="col-12 text-center text-danger mt-5">
                    <i class="fa fa-exclamation-triangle mb-2"></i>
                    <p>ไม่สามารถโหลดข้อมูลสินค้าเพิ่มเติมได้ (${error.message})</p>
                </div>
            `);
        });
}

document.addEventListener('DOMContentLoaded', loadProducts);