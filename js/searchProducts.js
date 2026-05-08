// ==========================================
// ไฟล์: js/searchProducts.js
// หน้าที่: แสดงผลสินค้า, ค้นหาแบบ Real-time, และเชื่อมปุ่มตะกร้า
// ==========================================

let allProducts = []; 

// 1. ฟังก์ชัน Render HTML ลงบนหน้าเว็บ
const renderProducts = (products) => {
    const gridContainer = document.getElementById('product-grid');
    const listContainer = document.getElementById('product-container');
    const container = gridContainer || listContainer;
    
    if (!container) return; 

    // กำหนดขนาดคอลัมน์ตามประเภทหน้าจอ (หน้าสินค้าหลักใช้ col-md-4, หน้าแรกใช้ col-md-3)
    const colClass = gridContainer ? 'col-md-4' : 'col-md-3';

    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><h3>Not Found Product</h3><p>ไม่พบสินค้าที่คุณค้นหา</p></div>';
        return;
    }

    container.innerHTML = products.map(p => {
        const badgeHTML = p.badge 
            ? `<span class="${p.badgeClass || 'sale'}">${p.badge}</span>` 
            : '';

        const priceHTML = p.originalPrice
            ? `<p class="mb-0"><span class="price price-sale">฿${p.originalPrice.toLocaleString()}</span> <span class="price">฿${p.price.toLocaleString()}</span></p>`
            : `<p class="mb-0"><span class="price">฿${p.price.toLocaleString()}</span></p>`;

        return `
            <div class="${colClass} d-flex mb-4">
                <div class="product ftco-animate fadeInUp ftco-animated">
                    <div class="img d-flex align-items-center justify-content-center" style="background-image: url(${p.imageUrl});">
                        <div class="desc">
                            <p class="meta-prod d-flex">
                                <a href="#" class="add-to-cart d-flex align-items-center justify-content-center" data-id="${p.id}">
                                    <span class="flaticon-shopping-bag"></span>
                                </a>
                                <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-heart"></span></a>
                                <a href="#" class="d-flex align-items-center justify-content-center"><span class="flaticon-visibility"></span></a>
                            </p>
                        </div>
                    </div>
                    <div class="text text-center">
                        ${badgeHTML}
                        <span class="category">${p.category}</span>
                        <h2>${p.title}</h2>
                        ${priceHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// 2. ฟังก์ชันจัดการการค้นหาและตัวกรอง
const handleSearchAndFilter = () => {
    const searchInput = document.getElementById('index-search-input');
    const categoryDropdown = document.getElementById('index-category-filter');

    // ดึงค่ามาเป็นตัวพิมพ์เล็กทั้งหมดเพื่อไม่ให้เกิดปัญหา Case-Sensitive
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const categoryVal = categoryDropdown ? categoryDropdown.value.toLowerCase() : 'all';

    const filteredProducts = allProducts.filter(p => {
        const titleLower = p.title.toLowerCase();
        const categoryLower = p.category.toLowerCase();
        
        // แยกชื่อสินค้าออกเป็นคำๆ เพื่อค้นหาจาก "ต้นคำ"
        const titleWords = titleLower.split(' ');
        
        // เช็คเงื่อนไขช่องค้นหา: หาเจอในชื่อ (ต้นคำ) หรือเจอในหมวดหมู่
        const matchSearch = searchVal === '' || 
                            titleWords.some(word => word.startsWith(searchVal)) || 
                            categoryLower.includes(searchVal);
        
        // เช็คเงื่อนไข Dropdown หมวดหมู่
        const matchDropdown = categoryVal === 'all' || categoryLower === categoryVal;

        // ต้องผ่านทั้งสองเงื่อนไข
        return matchSearch && matchDropdown; 
    });

    renderProducts(filteredProducts);
};

// 3. โหลดข้อมูลเริ่มต้นและผูก Event
const initStore = async () => {
    try {
        // ดึงข้อมูลจาก API SQLite โดยตรง
        const response = await fetch('http://localhost:3000/api/products');
        if (!response.ok) throw new Error("API Error");
        allProducts = await response.json();
    } catch (error) {
        console.warn('ไม่สามารถโหลดข้อมูลสินค้าได้');
    }

    // แสดงสินค้าทั้งหมดตอนเปิดเว็บ
    renderProducts(allProducts);

    // ผูก Event ให้ช่องค้นหาทำงานแบบ Real-time (พิมพ์ปุ๊บ กรองปั๊บ)
    const searchInput = document.getElementById('index-search-input');
    const categoryDropdown = document.getElementById('index-category-filter');

    if (searchInput) {
        searchInput.addEventListener('input', handleSearchAndFilter);
    }

    if (categoryDropdown) {
        categoryDropdown.addEventListener('change', handleSearchAndFilter);
    }
};

document.addEventListener('DOMContentLoaded', initStore);