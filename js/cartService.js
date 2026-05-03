// ==========================================
// ไฟล์: cartService.js (Compact Version)
// ==========================================

let cart = JSON.parse(localStorage.getItem('freshMarketCart')) || [];
let products = [];

// 1. โหลดข้อมูลเมื่อเปิดหน้าเว็บ
const initCart = async () => {
    try {
        products = await (await fetch('data/products.json')).json();
        updateUI();
    } catch (err) { console.error("Error loading products:", err); }
};

// 2. จัดการข้อมูลตะกร้า (รวบฟังก์ชันเพิ่มและลบไว้ด้วยกัน)
window.handleCartAction = (action, id) => {
    if (action === 'ADD') {
        const item = cart.find(i => i.productId === id);
        item ? item.quantity++ : cart.push({ productId: id, quantity: 1 });
    } else if (action === 'REMOVE') {
        cart = cart.filter(i => i.productId !== id);
    }
    localStorage.setItem('freshMarketCart', JSON.stringify(cart));
    updateUI();
};

// 3. อัปเดตหน้าตาเว็บรวดเดียว (Badge, Dropdown, Table)
const updateUI = () => {
    // 3.1 Navbar Badge
    const badge = document.querySelector('.btn-cart small');
    if (badge) badge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);

    if (!products.length) return; // ถ้ายังไม่โหลด JSON ให้หยุดแค่นี้

    // จับคู่ข้อมูลตะกร้า + รายละเอียดสินค้า
    const details = cart.map(c => ({ ...products.find(p => p.id === c.productId), qty: c.quantity })).filter(i => i.id);

    // 3.2 Dropdown Menu
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) {
        dropdown.innerHTML = details.length 
            ? details.map(i => `
                <div class="dropdown-item d-flex align-items-start">
                    <div class="img" style="background-image: url(${i.imageUrl});"></div>
                    <div class="text pl-3">
                        <h4>${i.title}</h4>
                        <p class="mb-0"><span class="price text-danger">฿${i.price.toLocaleString()}</span> <span class="ml-3">จำนวน: ${i.qty}</span></p>
                    </div>
                </div>`).join('') + `<a class="dropdown-item text-center btn-link d-block w-100" href="cart.html">View All &rarr;</a>`
            : '<div class="dropdown-item text-center py-3 text-muted">ไม่มีสินค้าในตะกร้า</div>';
    }

    // 3.3 Cart Page Table
    const tbody = document.querySelector('.table tbody');
    if (tbody) {
        tbody.innerHTML = details.length
            ? details.map(i => `
                <tr class="alert">
                    <td><label class="checkbox-wrap"><input type="checkbox" checked><span class="checkmark"></span></label></td>
                    <td><div class="img" style="background-image: url(${i.imageUrl});"></div></td>
                    <td><div class="email"><span>${i.title}</span><span>${i.category}</span></div></td>
                    <td>฿${i.price.toLocaleString()}</td>
                    <td><input type="text" class="form-control text-center px-0" value="${i.qty}" readonly style="width:50px; background:transparent; border:none;"></td>
                    <td>฿${(i.price * i.qty).toLocaleString()}</td>
                    <td><button type="button" class="close" onclick="handleCartAction('REMOVE', ${i.id})"><span aria-hidden="true"><i class="fa fa-close"></i></span></button></td>
                </tr>`).join('')
            : '<tr><td colspan="7" class="text-center py-5">ตะกร้าว่างเปล่า</td></tr>';
    }
};

// 4. Event Delegation ดักจับการคลิกปุ่ม Add to Cart ทั่วทั้งเว็บ
document.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-cart');
    if (btn) {
        e.preventDefault();
        const id = +btn.dataset.id; // ใช้ + ด้านหน้าเพื่อแปลง String เป็น Number สั้นๆ
        handleCartAction('ADD', id);
        alert(`เพิ่มสินค้า ID: ${id} ลงตะกร้าแล้ว`);
    }
});

// สั่งทำงานเมื่อโหลดเว็บเสร็จ
document.addEventListener('DOMContentLoaded', initCart);

// ==========================================
// ส่วนที่เพิ่มใหม่: ระบบคำนวณราคาก่อนชำระเงิน (Standalone Module)
// ==========================================

const calculateCheckoutTotal = () => {
    let subtotal = 0;
    
    // 1. ดึงแถวสินค้าในตะกร้าทั้งหมดมาตรวจสอบ
    const cartRows = document.querySelectorAll('.table tbody tr.alert');
    
    cartRows.forEach(row => {
        // หาช่อง Checkbox และช่องราคารวมของแถวนั้น (ช่องที่ 6)
        const checkbox = row.querySelector('input[type="checkbox"]');
        const totalCell = row.querySelector('td:nth-child(6)');
        
        // 2. ถ้ามีสินค้านี้อยู่ และถูก "ติ๊กเลือก" ให้นำมารวมยอด
        if (checkbox && checkbox.checked && totalCell) {
            // ตัดสัญลักษณ์ ฿ และเครื่องหมายลูกน้ำ (,) ออก เพื่อแปลงเป็นตัวเลขทางคณิตศาสตร์
            const itemTotal = parseFloat(totalCell.textContent.replace(/[^0-9.-]+/g, ""));
            subtotal += itemTotal;
        }
    });

    // 3. กำหนดตัวแปรสำหรับค่าใช้จ่ายอื่นๆ (เตรียมพร้อมสำหรับต่อยอด)
    const deliveryFee = 0; 
    const discount = 0;    
    const finalTotal = subtotal + deliveryFee - discount;

    // 4. นำตัวเลขไปแสดงผลที่กล่อง Cart Totals
    const cartTotalContainer = document.querySelector('.cart-total');
    if (cartTotalContainer) {
        const summaryRows = cartTotalContainer.querySelectorAll('p.d-flex:not(.total-price) span:nth-child(2)');
        const totalRow = cartTotalContainer.querySelector('.total-price span:nth-child(2)');

        // อัปเดตบรรทัด Subtotal, Delivery, Discount
        if (summaryRows.length >= 3) {
            summaryRows[0].textContent = '฿' + subtotal.toLocaleString();
            summaryRows[1].textContent = '฿' + deliveryFee.toLocaleString();
            summaryRows[2].textContent = '฿' + discount.toLocaleString();
        }

        // อัปเดตบรรทัดยอดรวมจ่ายจริง
        if (totalRow) {
            totalRow.textContent = '฿' + finalTotal.toLocaleString();
        }
    }
};

// ==========================================
// ติดตั้งตัวดักจับเหตุการณ์ (Event Listeners) โดยไม่กวนโค้ดเดิม
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ดักจับเมื่อมีการคลิก Checkbox เพื่อคำนวณใหม่ทันที
    document.addEventListener('change', (e) => {
        if (e.target.matches('.table tbody input[type="checkbox"]')) {
            calculateCheckoutTotal();
        }
    });

    // 2. ดักจับเมื่อกดปุ่ม "ลบสินค้า" (ตัว X) ให้คำนวณใหม่หลังจากโค้ดเก่าลบแถวทิ้งเสร็จแล้ว
    document.addEventListener('click', (e) => {
        if (e.target.closest('button.close')) {
            setTimeout(calculateCheckoutTotal, 50); // หน่วงเวลา 50ms ให้โค้ดเดิมเคลียร์ DOM ก่อน
        }
    });

    // 3. ท่าไม้ตาย: ใช้ MutationObserver เฝ้าดูตาราง
    // เมื่อฟังก์ชันโหลด JSON โค้ดเก่าสร้างตารางเสร็จปุ๊บ ระบบจะคำนวณยอดให้ทันที
    const tbody = document.querySelector('.table tbody');
    if (tbody) {
        new MutationObserver(() => {
            calculateCheckoutTotal();
        }).observe(tbody, { childList: true });
    }
});