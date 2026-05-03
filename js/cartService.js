// ==========================================
// ระบบคำนวณราคาสินค้าในตระกร้า (Cart Calculator - Pure Items)
// ==========================================

function calculateCartTotal() {
    let subtotal = 0; // ต้องเริ่มจาก 0 เพื่อรอรับค่าจากสินค้าที่ติ๊กเลือก

    // 1. ค้นหาแถวของสินค้าทั้งหมดในตาราง
    const cartRows = document.querySelectorAll('tbody tr');

    cartRows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const priceElement = row.querySelector('td:nth-child(4)'); // ช่องราคา
        const quantityInput = row.querySelector('input[name="quantity"]'); // ช่องจำนวน
        const itemTotalElement = row.querySelector('td:nth-child(6)'); // ช่องราคารวม

        if (checkbox && priceElement && quantityInput && itemTotalElement) {
            const price = parseFloat(priceElement.textContent.replace(/[^0-9.-]+/g, ""));
            const quantity = parseInt(quantityInput.value) || 0;

            const itemTotal = price * quantity;
            itemTotalElement.textContent = '$' + itemTotal.toFixed(2);

            // 🌟 นำราคามารวมเฉพาะชิ้นที่ "ติ๊กถูก" เท่านั้น
            if (checkbox.checked) {
                subtotal += itemTotal;
            }
        }
    });

    // 2. สรุปยอด Total แบบตรงไปตรงมา (เท่ากับยอด Subtotal เพียวๆ)
    const total = subtotal;

    // 3. แสดงผลลงในกล่อง Cart Totals
    const cartTotalContainer = document.querySelector('.cart-total');
    if (cartTotalContainer) {
        const summaryRows = cartTotalContainer.querySelectorAll('p.d-flex:not(.total-price)');
        const totalRow = cartTotalContainer.querySelector('.total-price span:nth-child(2)');

        if (summaryRows.length >= 3) {
            summaryRows[0].querySelector('span:nth-child(2)').textContent = '$' + subtotal.toFixed(2);
            summaryRows[1].querySelector('span:nth-child(2)').textContent = '$0.00'; // ซ่อนค่าส่งไว้ก่อน
            summaryRows[2].querySelector('span:nth-child(2)').textContent = '$0.00'; // ซ่อนส่วนลดไว้ก่อน
        }

        if (totalRow) {
            totalRow.textContent = '$' + total.toFixed(2); // ยอดจ่ายจริง
        }
    }
}

// ==========================================
// ติดตั้ง Event Listeners เพื่อให้คำนวณ Real-time
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    calculateCartTotal(); // คำนวณครั้งแรกตอนเปิดหน้าเว็บ

    const tableBody = document.querySelector('tbody');
    if (tableBody) {
        // จับการคลิกติ๊กถูก / ปุ่ม +/-
        tableBody.addEventListener('click', () => {
            setTimeout(calculateCartTotal, 50);
        });

        // จับการพิมพ์เปลี่ยนตัวเลข
        tableBody.addEventListener('input', (e) => {
            if (e.target.name === 'quantity') {
                calculateCartTotal();
            }
        });
    }
});