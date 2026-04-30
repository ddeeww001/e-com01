// ==========================================
// ไฟล์: cartService.js
// หน้าที่: จัดการระบบตะกร้าสินค้าด้วย Event Delegation
// ==========================================

// 1. สร้าง Array ว่างๆ ไว้เก็บข้อมูลสินค้าที่ถูกเพิ่มลงตะกร้า
let cart = [];

// ==========================================
// 2. Handler Function: จัดการอัปเดตข้อมูลตะกร้า (Logic)
// ==========================================
function updateCart(productId) {
    // ใช้ .find() เพื่อเช็คว่ามีสินค้ารหัสนี้อยู่ในตะกร้าแล้วหรือยัง
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        // ถ้ามีอยู่แล้ว ให้บวกจำนวน (Quantity) เพิ่มขึ้น 1
        existingItem.quantity += 1;
    } else {
        // ถ้ายังไม่มี ให้ Push ข้อมูลเข้าไปใหม่
        cart.push({ productId: productId, quantity: 1 });
    }

    // แสดงผลใน Console เพื่อให้เช็คข้อมูลเวลา Debug
    console.log("สถานะตะกร้าปัจจุบัน:", cart);

    // อัปเดต UI ตัวเลขบนไอคอนตะกร้าที่ Navbar ทันที
    updateCartIconUI();
}

// ฟังก์ชันเสริม: เอาไว้อัปเดตตัวเลข <small> บนไอคอนตะกร้า
function updateCartIconUI() {
    // อ้างอิงไปที่ตัวเลขในตะกร้าบน Navbar
    const cartCountElement = document.querySelector('.btn-cart small');
    if (cartCountElement) {
        // คำนวณจำนวนชิ้นทั้งหมดในตะกร้า
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        // อัปเดตตัวเลขลงไปใน HTML
        cartCountElement.textContent = totalItems;
    }
}

// ==========================================
// 3. Event Listener: ดักจับการคลิก (Event Delegation)
// ==========================================
function setupCartEventDelegation() {
    // ชี้เป้าไปที่ Parent Div ที่ครอบสินค้าทั้งหมด (ปรับเป็น #product-container ตามโครงสร้างจริง)
    const catalogDiv = document.querySelector('#product-container');

    // ถ้าไม่พบ Element นี้ (เช่น อยู่หน้าอื่นที่ไม่มีสินค้า) ให้หยุดทำงาน ป้องกัน Error
    if (!catalogDiv) return;

    // ผูก Event Listener แบบ 'click' ไว้ที่ Parent เพียงตัวเดียว
    catalogDiv.addEventListener('click', function(event) {
        // ใช้ .closest() สแกนหาว่าบริเวณที่ถูกคลิก มีคลาส .add-to-cart ครอบอยู่ไหม
        const targetButton = event.target.closest('.add-to-cart');

        // ถ้าเข้าเงื่อนไข (แปลว่าผู้ใช้คลิกโดนปุ่มเพิ่มลงตะกร้า)
        if (targetButton) {
            // ป้องกันพฤติกรรมดั้งเดิมของลิงก์ (href="#") ไม่ให้หน้าเว็บเด้งกลับไปบนสุด
            event.preventDefault();

            // ดึงค่า ID สินค้าจาก Attribute 'data-id' และแปลงเป็นตัวเลข (Base 10)
            const productId = parseInt(targetButton.getAttribute('data-id'), 10);

            // โยน ID ไปให้ Handler Function ทำงานต่อ
            updateCart(productId);
            
            // แจ้งเตือนผู้ใช้ (หรือในอนาคตอาจจะเปลี่ยนเป็น Toast Notification สวยๆ ก็ได้)
            alert(`เพิ่มสินค้า ID: ${productId} ลงในตะกร้าเรียบร้อยแล้ว!`);
        }
    });
}

// ==========================================
// 4. Initialization: เริ่มทำงานเมื่อโหลด DOM เสร็จ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // คอยเคลียร์ค่าตัวเลขตะกร้าตอนโหลดหน้าเว็บให้เป็น 0 ก่อน (หรือดึงจาก LocalStorage ถ้ามี)
    updateCartIconUI(); 
    
    // เริ่มดักจับการคลิก
    setupCartEventDelegation();
});