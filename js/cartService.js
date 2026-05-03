// ==========================================
// E-commerce 01: Master Cart & Checkout System
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

// 2. จัดการข้อมูลตะกร้า (เพิ่ม/ลบ)
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

// 3. วาด UI ตารางและ Dropdown
const updateUI = () => {
    // 3.1 Navbar Badge
    const badge = document.querySelector('.btn-cart small');
    if (badge) badge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);

    if (!products.length) return; 

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
                    <!-- 🌟 ปลดล็อก readonly เปลี่ยนเป็น input type="number" และเพิ่ม class qty-input -->
                    <td><input type="number" class="form-control text-center px-2 qty-input" data-id="${i.id}" value="${i.qty}" min="1" style="width:80px; background:#fff; border: 1px solid #e6e6e6; border-radius: 5px;"></td>
                    <td>฿${(i.price * i.qty).toLocaleString()}</td>
                    <td><button type="button" class="close" onclick="handleCartAction('REMOVE', ${i.id})"><span aria-hidden="true"><i class="fa fa-close"></i></span></button></td>
                </tr>`).join('')
            : '<tr><td colspan="7" class="text-center py-5">ตะกร้าว่างเปล่า</td></tr>';
    }
    
    // เมื่อวาดตารางเสร็จ ให้สั่งคำนวณยอดเงินทันที
    calculateCheckoutTotal();
};

// 4. ระบบคำนวณราคาก่อนชำระเงิน (Standalone Module)
const calculateCheckoutTotal = () => {
    let subtotal = 0;
    
    const cartRows = document.querySelectorAll('.table tbody tr.alert');
    cartRows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const totalCell = row.querySelector('td:nth-child(6)');
        
        if (checkbox && checkbox.checked && totalCell) {
            const itemTotal = parseFloat(totalCell.textContent.replace(/[^0-9.-]+/g, ""));
            subtotal += itemTotal;
        }
    });

    const deliveryFee = 0; 
    const discount = 0;    
    const finalTotal = subtotal + deliveryFee - discount;

    const cartTotalContainer = document.querySelector('.cart-total');
    if (cartTotalContainer) {
        const summaryRows = cartTotalContainer.querySelectorAll('p.d-flex:not(.total-price) span:nth-child(2)');
        const totalRow = cartTotalContainer.querySelector('.total-price span:nth-child(2)');

        if (summaryRows.length >= 3) {
            summaryRows[0].textContent = '฿' + subtotal.toLocaleString();
            summaryRows[1].textContent = '฿' + deliveryFee.toLocaleString();
            summaryRows[2].textContent = '฿' + discount.toLocaleString();
        }
        if (totalRow) {
            totalRow.textContent = '฿' + finalTotal.toLocaleString();
        }
    }
};

// 5. ติดตั้งตัวดักจับเหตุการณ์ (Event Listeners)
document.addEventListener('DOMContentLoaded', () => {
    initCart();

    // 5.1 ดักจับการคลิกปุ่ม Add to Cart ทั่วทั้งเว็บ
    document.addEventListener('click', e => {
        const btn = e.target.closest('.add-to-cart');
        if (btn) {
            e.preventDefault();
            const id = +btn.dataset.id;
            handleCartAction('ADD', id);
            alert(`เพิ่มสินค้าลงตะกร้าแล้ว`);
        }
    });

    // 5.2 ดักจับการคลิก Checkbox หน้าตะกร้า
    document.addEventListener('change', (e) => {
        if (e.target.matches('.table tbody input[type="checkbox"]')) {
            calculateCheckoutTotal();
        }
    });

    // 5.3 🌟 ดักจับการพิมพ์ตัวเลขในช่องจำนวน (Real-time Calculation)
    document.addEventListener('input', (e) => {
        if (e.target.matches('.qty-input')) {
            const inputElement = e.target;
            const id = parseInt(inputElement.dataset.id);
            let newQty = parseInt(inputElement.value);

            // ถ้าผู้ใช้พิมพ์ค่าที่ถูกต้อง (มากกว่า 0)
            if (newQty > 0) {
                // ก. อัปเดตข้อมูลใน localStorage ก่อน
                const item = cart.find(i => i.productId === id);
                if (item) {
                    item.quantity = newQty;
                    localStorage.setItem('freshMarketCart', JSON.stringify(cart));
                    
                    // ข. อัปเดตตัวเลขไอคอนตะกร้าด้านบน (Badge)
                    const badge = document.querySelector('.btn-cart small');
                    if (badge) badge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);

                    // ค. อัปเดตราคารวมของ "สินค้านั้น" ทันที โดยไม่โหลดตารางใหม่
                    const row = inputElement.closest('tr');
                    const priceText = row.querySelector('td:nth-child(4)').textContent;
                    const price = parseFloat(priceText.replace(/[^0-9.-]+/g, ""));
                    const rowTotalCell = row.querySelector('td:nth-child(6)');
                    rowTotalCell.textContent = '฿' + (price * newQty).toLocaleString();

                    // ง. โยนให้ฟังก์ชันคำนวณยอดสรุปใหญ่ (Cart Totals) ทำงานต่อ
                    calculateCheckoutTotal();
                }
            }
        }
    });
});