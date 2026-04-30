// ==========================================
// ไฟล์: cartService.js
// หน้าที่: จัดการระบบตะกร้าสินค้า (อัปเดต UI ทั้ง Dropdown และหน้า Cart)
// ==========================================

// 1. โหลดข้อมูลตะกร้าจาก LocalStorage
let cart = JSON.parse(localStorage.getItem('freshMarketCart')) || [];
let allProductsData = []; // สร้างตัวแปรมารอเก็บข้อมูลสินค้าทั้งหมด

// 2. ฟังก์ชันสำหรับโหลด JSON (เพื่อนำชื่อ รูป และราคา มาประกอบกับ ID ในตะกร้า)
async function loadProductDataForCart() {
    try {
        const response = await fetch('data/products.json');
        allProductsData = await response.json();
        
        // เมื่อโหลดข้อมูล JSON เสร็จ ให้สั่งอัปเดตหน้าตาตะกร้าทันที
        updateCartUI(); 
    } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลสินค้าสำหรับตะกร้าได้:", error);
    }
}

// 3. Handler Function: จัดการการเพิ่มสินค้าลงตะกร้า
function updateCart(productId) {
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId: productId, quantity: 1 });
    }

    // บันทึกลง LocalStorage
    localStorage.setItem('freshMarketCart', JSON.stringify(cart));
    
    // อัปเดต UI ทุกส่วนทันที
    updateCartUI();
}

// 4. ฟังก์ชันหลักสำหรับรวบรวมคำสั่งอัปเดตหน้าตา (UI)
function updateCartUI() {
    // 4.1 อัปเดตตัวเลขสีแดงบนไอคอน Navbar
    const cartCountElement = document.querySelector('.btn-cart small');
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }

    // ถ้ายังโหลดข้อมูลสินค้าไม่เสร็จ ให้หยุดการทำงานท่อนล่างไว้ก่อน
    if (allProductsData.length === 0) return;

    // นำ ID ในตะกร้า มาจับคู่ (Map) กับข้อมูลสินค้าเต็มๆ 
    const cartDetails = cart.map(cartItem => {
        const product = allProductsData.find(p => p.id === cartItem.productId);
        return { ...product, quantity: cartItem.quantity }; // รวมข้อมูลสินค้าเข้ากับจำนวนที่สั่ง
    }).filter(item => item.id !== undefined); // กันเหนียว เผื่อหาสินค้าไม่เจอ

    // 4.2 นำข้อมูลที่จับคู่แล้ว ไปสร้าง HTML สำหรับ Dropdown
    renderDropdownCart(cartDetails);

    // 4.3 นำข้อมูลที่จับคู่แล้ว ไปสร้าง HTML สำหรับหน้า cart.html
    renderCartPage(cartDetails);
}

// 5. ฟังก์ชันสร้าง HTML แทรกใน Dropdown Navbar
function renderDropdownCart(cartDetails) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!dropdownMenu) return; // ถ้าไม่พบเมนูนี้ ให้ข้ามไป

    // กรณีตะกร้าว่างเปล่า
    if (cartDetails.length === 0) {
        dropdownMenu.innerHTML = '<div class="dropdown-item text-center py-3 text-muted">ไม่มีสินค้าในตะกร้า</div>';
        return;
    }

    // สร้าง HTML สำหรับสินค้าแต่ละชิ้น
    const itemsHTML = cartDetails.map(item => `
        <div class="dropdown-item d-flex align-items-start">
            <div class="img" style="background-image: url(${item.imageUrl});"></div>
            <div class="text pl-3">
                <h4>${item.title}</h4>
                <p class="mb-0">
                    <span class="price" style="color: #b7472a;">฿${item.price.toLocaleString()}</span>
                    <span class="quantity ml-3">จำนวน: ${item.quantity}</span>
                </p>
            </div>
        </div>
    `).join('');

    // ปุ่ม View All ด้านล่างสุด
    const viewAllHTML = `
        <a class="dropdown-item text-center btn-link d-block w-100" href="cart.html">
            View All <span class="ion-ios-arrow-round-forward"></span>
        </a>
    `;

    dropdownMenu.innerHTML = itemsHTML + viewAllHTML;
}

// 6. ฟังก์ชันสร้าง HTML แทรกในหน้า cart.html (ตารางสินค้า)
function renderCartPage(cartDetails) {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return; // ถ้าไม่ได้อยู่หน้า cart.html คำสั่งนี้จะไม่ทำงาน

    if (cartDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5">ตะกร้าสินค้าของคุณว่างเปล่า</td></tr>';
        return;
    }

    // จำลองโครงสร้างตาราง HTML ให้เหมือนธีมเดิมของคุณ
    const rowsHTML = cartDetails.map(item => `
        <tr class="alert" role="alert">
            <td>
                <label class="checkbox-wrap checkbox-primary">
                    <input type="checkbox" checked>
                    <span class="checkmark"></span>
                </label>
            </td>
            <td>
                <div class="img" style="background-image: url(${item.imageUrl});"></div>
            </td>
            <td>
                <div class="email">
                    <span>${item.title}</span>
                    <span>${item.category}</span>
                </div>
            </td>
            <td>฿${item.price.toLocaleString()}</td>
            <td class="quantity">
                <div class="input-group">
                    <input type="text" name="quantity" class="quantity form-control input-number text-center" value="${item.quantity}" readonly>
                </div>
            </td>
            <td>฿${(item.price * item.quantity).toLocaleString()}</td>
            <td>
                <button type="button" class="close" data-dismiss="alert" aria-label="Close" onclick="removeFromCart(${item.id})">
                    <span aria-hidden="true"><i class="fa fa-close"></i></span>
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = rowsHTML;
}

// 7. ฟังก์ชันสำหรับลบสินค้าออกจากตะกร้า (ทำงานเมื่อกดกากบาทในตาราง)
window.removeFromCart = function(productId) {
    // กรองเอาเฉพาะสินค้าที่ไม่ได้กดลบเก็บไว้
    cart = cart.filter(item => item.productId !== productId);
    localStorage.setItem('freshMarketCart', JSON.stringify(cart));
    updateCartUI(); // รีเฟรชหน้าตาใหม่ทันที
};

// 8. Event Listener ดักจับการคลิกเพิ่มสินค้า
function setupCartEventDelegation() {
    const catalogDiv = document.querySelector('#product-container');
    if (!catalogDiv) return;

    catalogDiv.addEventListener('click', function(event) {
        const targetButton = event.target.closest('.add-to-cart');
        if (targetButton) {
            event.preventDefault();
            const productId = parseInt(targetButton.getAttribute('data-id'), 10);
            updateCart(productId);
            alert(`เพิ่ม ${productId} ลงตะกร้าแล้ว`);
        }
    });
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadProductDataForCart(); // โหลด JSON สินค้าขึ้นมาสแตนด์บายไว้เพื่อเรนเดอร์ UI ทันที
    setupCartEventDelegation();
});