let allProducts = []; 

function renderProducts(products) {
    //  ตรวจสอบว่ามี Container อยู่จริงหรือไม่ก่อนเริ่มทำงาน
    const container = document.getElementById('product-container');
    if (!container) return; 

    // กรณีค้นหาไม่เจอ
    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><h3>Not Found Product</h3></div>';
        return;
    }

    //  สร้าง HTML และใช้ .join('') เพื่อรวมเป็น String เดียว
    const html = products.map(p => `
        <div class="col-md-3 d-flex mb-4">
            <div class="product ftco-animate">
                <div class="img d-flex align-items-center justify-content-center" 
                     style="background-image: url(${p.imageUrl}); height: 300px; background-size: cover;">
                    <div class="desc">
                        <p class="meta-prod d-flex">
                            <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-shopping-bag"></span></a>
                            <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-heart"></span></a>
                            <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-visibility"></span></a>
                        </p>
                    </div>
                </div>
                <div class="text text-center pt-3 mt-3">
                    <span class="category">${p.category}</span>
                    <h2>${p.title}</h2>
                    <p class="mb-0"><span class="price">฿${p.price.toLocaleString()}</span></p>
                </div>
            </div>
        </div>
    `).join(''); 

    container.innerHTML = html;

    // แก้ปัญหา "สินค้าล่องหน": บังคับให้คลาส ftco-animate ทำงานทันที
    const elements = container.querySelectorAll('.ftco-animate');
    elements.forEach(el => {
        el.classList.add('fadeInUp', 'ftco-animated'); // สั่งให้แสดงตัวทันที
        el.style.opacity = "1"; // ป้องกันสไตล์เดิมบังไว้
    });
}

// ฟังก์ชัน Search ตามเงื่อนไข พิมพ์ 5 ตัว หรือ Enter
function handleSearch(event) {
    const searchVal = document.getElementById('index-search-input').value.toLowerCase();
    const categoryVal = document.getElementById('index-category-filter').value;

    if (event.key === 'Enter' || searchVal.length >= 5 || searchVal.length === 0) {
        const filtered = allProducts.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchVal);
            const matchesCategory = (categoryVal === 'all' || p.category === categoryVal);
            return matchesSearch && matchesCategory;
        });
        renderProducts(filtered);
    }
}

// โหลดข้อมูลเริ่มต้น
async function init() {
    try {
        const response = await fetch('data/products.json');
        allProducts = await response.json();
        renderProducts(allProducts);

        document.getElementById('index-search-input').addEventListener('keyup', handleSearch);
        document.getElementById('index-category-filter').addEventListener('change', () => handleSearch({ key: 'Enter' }));
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener('DOMContentLoaded', init);