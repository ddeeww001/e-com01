let allProducts = []; // เก็บข้อมูลสินค้าต้นฉบับทั้งหมด

// ฟังก์ชันสำหรับสั่งให้ Animation ของ Template ทำงานอีกครั้ง
function refreshAnimations() {
    if (typeof $.fn.waypoint !== 'undefined') {
        $('.ftco-animate').waypoint(function(direction) {
            if(direction === 'down' && !$(this.element).hasClass('ftco-animated')) {
                $(this.element).addClass('item-animate');
                setTimeout(function(){
                    $('body .ftco-animate.item-animate').each(function(k){
                        var el = $(this);
                        setTimeout( function () {
                            var effect = el.data('animate-effect');
                            el.addClass(effect + ' ftco-animated').removeClass('item-animate');
                        },  k * 50, 'easeInOutExpo' );
                    });
                }, 100);
            }
        }, { offset: '95%' });
    }
}

// ฟังก์ชันสำหรับวาด UI สินค้า [cite: 52]
function renderProducts(products) {

    const container = document.querySelector('#product-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><h3>ไม่พบสินค้าที่ต้องการ (Not Found Product)</h3></div>';
        return;
    }

    const html = products.map(product => {
        const badgeHTML = product.badge 
            ? `<span class="${product.badgeClass || 'sale'}" style="position: absolute; top: 10px; left: 10px; z-index: 1; padding: 5px 10px; color: #fff; background: ${product.badgeClass === 'badge-danger' ? 'red' : 'orange'};">${product.badge}</span>` 
            : '';

        const priceHTML = product.originalPrice
            ? `<p class="mb-0"><span class="price price-sale" style="text-decoration: line-through; color: #b3b3b3; margin-right: 10px;">฿${product.originalPrice.toLocaleString()}</span> <span class="price">฿${product.price.toLocaleString()}</span></p>`
            : `<p class="mb-0"><span class="price">฿${product.price.toLocaleString()}</span></p>`;

        return `
            <div class="col-md-3 d-flex mb-4">
                <div class="product w-100 position-relative ftco-animate">
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

    container.innerHTML = html;
    refreshAnimations(); // เรียกใช้เพื่อให้สินค้าที่โหลดใหม่แสดงผลแอนิเมชั่น
}

// ฟังก์ชันหลักในการกรองข้อมูล (Search & Filter)
function handleSearch(event) {
    const searchInput = document.getElementById('index-search-input');
    const categoryVal = document.getElementById('index-category-filter').value;
    const searchVal = searchInput.value.toLowerCase(); // เงื่อนไข: เซ็ตเป็นตัวพิมพ์เล็ก

    // ตรวจสอบเงื่อนไข: พิมพ์ 5 ตัวขึ้นไป หรือ กด Enter หรือ ลบจนว่าง
    if (event.key === 'Enter' || searchVal.length >= 5 || searchVal.length === 0) {
        
        let filtered = allProducts.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchVal);
            const matchesCategory = (categoryVal === 'all' || p.category === categoryVal);
            return matchesSearch && matchesCategory;
        });

        renderProducts(filtered);
    }
}

// โหลดข้อมูลเริ่มต้น [cite: 50]
function loadInitialData() {
    fetch('data/products.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(products => {
            allProducts = products;
            renderProducts(allProducts);

            // ผูก Event การค้นหา
            const input = document.getElementById('index-search-input');
            const select = document.getElementById('index-category-filter');

            if(input) input.addEventListener('keyup', handleSearch);
            if(select) select.addEventListener('change', () => handleSearch({ key: 'Enter' }));
        })
        .catch(error => {
            console.error('Error fetching product data:', error);
        });
}

document.addEventListener('DOMContentLoaded', loadInitialData);