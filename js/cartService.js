// ==========================================
// ไฟล์: cartService.js
// หน้าที่: จัดการระบบตะกร้าสินค้า (รองรับ LocalStorage ข้ามหน้าเว็บ)
// ==========================================

// 1. โหลดข้อมูลตะกร้าจาก LocalStorage ก่อน
// ถ้ามีข้อมูลอยู่แล้วให้ดึงมาใช้ ถ้าไม่มีให้เริ่มเป็น Array ว่าง []
// ผมตั้งชื่อ Key ว่า 'freshMarketCart' เพื่อให้จัดการข้อมูลได้ง่ายครับ
let cart = JSON.parse(localStorage.getItem('freshMarketCart')) || [];

// ==========================================
// 2. Handler Function: จัดการอัปเดตข้อมูลตะกร้า
// ==========================================
function updateCart(productId) {
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId: productId, quantity: 1 });
    }

    console.log("สถานะตะกร้าปัจจุบัน:", cart);

    // [ส่วนที่เพิ่มใหม่] บันทึกข้อมูลลง LocalStorage ทันทีที่มีการแก้ไขตะกร้า
    localStorage.setItem('freshMarketCart', JSON.stringify(cart));

    // อัปเดต UI ตัวเลขบนไอคอน
    updateCartIconUI();
}

// ฟังก์ชันสำหรับอัปเดตตัวเลขบนไอคอนตะกร้า <small>
function updateCartIconUI() {
    const cartCountElement = document.querySelector('.btn-cart small');
    if (cartCountElement) {
        // คำนวณจำนวนชิ้นทั้งหมดในตะกร้า
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// ==========================================
// 3. Event Listener: ดักจับการคลิก (Event Delegation)
// ==========================================
function setupCartEventDelegation() {
    const catalogDiv = document.querySelector('#product-container');

    if (!catalogDiv) return;

    catalogDiv.addEventListener('click', function(event) {
        const targetButton = event.target.closest('.add-to-cart');

        if (targetButton) {
            event.preventDefault();
            const productId = parseInt(targetButton.getAttribute('data-id'), 10);
            updateCart(productId);
            alert(`เพิ่มสินค้า ID: ${productId} ลงในตะกร้าเรียบร้อยแล้ว!`);
        }
    });
}

// ==========================================
// 4. Initialization: เริ่มทำงานเมื่อโหลด DOM เสร็จ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // โหลดตัวเลขจาก LocalStorage มาแสดงทันทีที่เปิดหน้าเว็บใหม่
    // ทำให้ตัวเลขตะกร้าโชว์จำนวนที่ถูกต้องเสมอ ไม่ว่าจะกดไปหน้า About, Blog หรือหน้าไหนๆ
    updateCartIconUI(); 
    
    // เริ่มดักจับการคลิกเพิ่มสินค้า
    setupCartEventDelegation();
});