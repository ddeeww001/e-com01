// ==========================================
// E-commerce 01: Advanced Checkout System (Synced with Server)
// ==========================================

// ==========================================
// E-commerce 01: Advanced Checkout System (Synced with Server)
// ==========================================

(function() {
    const CHECKOUT_API_URL = 'http://localhost:3000/api/checkout';
    let selectedPaymentMethod = null;

    // 1. Initial Load
    async function initCheckout() {
        const userString = localStorage.getItem('sunUser');
        const token = localStorage.getItem('sunToken');

        if (!userString || !token) {
            alert("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
            window.location.href = 'index.html';
            return;
        }

        const user = JSON.parse(userString);

        // Load Order Summary from Session Storage
        const pendingData = sessionStorage.getItem('pendingCheckout');
        if (!pendingData) {
            alert("ไม่มีข้อมูลสินค้าที่จะสั่งซื้อ กรุณากลับไปเลือกสินค้าในตะกร้า");
            window.location.href = 'cart.html';
            return;
        }
        
        const items = JSON.parse(pendingData);
        renderOrderSummary(items);

        // 🌟 Auto-fill Profile (From Server First, then LocalStorage Fallback)
        try {
            // ดึงจากเซิร์ฟเวอร์
            const response = await fetch(`${CHECKOUT_API_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profile = await response.json();
            
            // ดึงจาก LocalStorage (เผื่อกรอกค้างไว้แต่ยังไม่ได้กดสั่ง)
            const localProfile = JSON.parse(localStorage.getItem(`temp_profile_${user.username}`)) || {};

            const fields = ['firstname', 'lastname', 'country', 'streetaddress', 'apartment', 'towncity', 'postcodezip', 'phone', 'emailaddress'];
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    // ลำดับความสำคัญ: ข้อมูลจากเซิร์ฟเวอร์ > ข้อมูลที่พิมพ์ค้างไว้ > ว่างเปล่า
                    el.value = profile[id] || localProfile[id] || '';
                }
            });
        } catch (err) { console.error("Profile load error:", err); }
        
        validateForm();
    }

    // 🌟 1.5 Save to LocalStorage while typing
    function saveToLocal() {
        const userString = localStorage.getItem('sunUser');
        if (!userString) return;
        const user = JSON.parse(userString);

        const profileData = {};
        ['firstname', 'lastname', 'country', 'streetaddress', 'apartment', 'towncity', 'postcodezip', 'phone', 'emailaddress'].forEach(id => {
            const el = document.getElementById(id);
            if (el) profileData[id] = el.value;
        });

        localStorage.setItem(`temp_profile_${user.username}`, JSON.stringify(profileData));
    }

    // 2. UI Rendering
    function renderOrderSummary(items) {
        const itemsListContainer = document.getElementById('order-items-list');
        const subtotalEl = document.getElementById('summary-subtotal');
        const totalEl = document.getElementById('summary-total');
        
        if (!itemsListContainer || !subtotalEl || !totalEl) return;

        let subtotal = 0;
        let itemsHtml = '';
        
        items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 0;
            const itemTotal = price * qty;
            subtotal += itemTotal;
            
            itemsHtml += `
                <p class="d-flex">
                    <span>
                        <strong>${item.title}</strong><br>
                        <small class="text-muted">฿${price.toLocaleString()} x ${qty}</small>
                    </span>
                    <span class="text-dark font-weight-bold">฿${itemTotal.toLocaleString()}</span>
                </p>
            `;
        });

        // ใส่รายการสินค้าลงใน Container
        itemsListContainer.innerHTML = itemsHtml;

        // อัปเดตตัวเลขในจุดที่เตรียมไว้
        subtotalEl.textContent = '฿' + subtotal.toLocaleString();
        totalEl.textContent = '฿' + subtotal.toLocaleString();

        validateForm(); // รีเช็คปุ่มหลังจากเรนเดอร์ราคาเสร็จ
    }

    // 3. Validation Logic
    function validateForm() {
        const requiredIds = ['firstname', 'lastname', 'streetaddress', 'towncity', 'postcodezip', 'phone', 'emailaddress'];
        const allFilled = requiredIds.every(id => document.getElementById(id)?.value.trim() !== '');
        
        const termsChecked = document.getElementById('terms-check')?.checked;
        const isPaymentSelected = selectedPaymentMethod !== null;
        
        let paymentReady = true;
        if (selectedPaymentMethod === 'card') {
            const cardNum = document.getElementById('creditCardNumber')?.value.trim();
            paymentReady = /^\d{16}$/.test(cardNum);
        }

        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            // ดึงราคาจากตัวเลขใน HTML
            const totalText = document.getElementById('summary-total')?.textContent || "0";
            const totalValue = parseFloat(totalText.replace(/[^\d.-]/g, '')) || 0;

            // เงื่อนไข: ข้อมูลครบ + ยอมรับเงื่อนไข + เลือกวิธีจ่ายเงิน + (ถ้าเป็นบัตร) เลขครบ 16 หลัก + ยอดเงิน > 0
            if (allFilled && termsChecked && isPaymentSelected && paymentReady && totalValue > 0) {
                placeOrderBtn.classList.remove('disabled');
                placeOrderBtn.style.pointerEvents = 'auto';
                placeOrderBtn.style.opacity = '1';
            } else {
                placeOrderBtn.classList.add('disabled');
                placeOrderBtn.style.pointerEvents = 'none';
                placeOrderBtn.style.opacity = '0.5';
            }
        }
    }

    // 4. Interaction Handlers
    function handlePaymentSelection(e) {
        const card = e.target.closest('.payment-method-card');
        if (!card) return;

        // UI Toggle
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        selectedPaymentMethod = card.dataset.method;
        
        const detailsContainer = document.getElementById('payment-details-container');
        const cardDiv = document.getElementById('card-payment');

        if (selectedPaymentMethod === 'card') {
            detailsContainer.style.display = 'block';
            cardDiv.classList.remove('d-none');
        } else {
            detailsContainer.style.display = 'none';
            cardDiv.classList.add('d-none');
        }

        validateForm();
    }

    async function handlePlaceOrder(e) {
        e.preventDefault();
        const btn = e.target;
        if (btn.classList.contains('disabled')) return;

        // Reset Errors
        document.querySelectorAll('.error-msg').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });

        const token = localStorage.getItem('sunToken');
        const pendingItems = JSON.parse(sessionStorage.getItem('pendingCheckout'));
        
        const profileData = {};
        ['firstname', 'lastname', 'country', 'streetaddress', 'apartment', 'towncity', 'postcodezip', 'phone', 'emailaddress'].forEach(id => {
            profileData[id] = document.getElementById(id).value;
        });

        const creditCardNumber = document.getElementById('creditCardNumber')?.value.trim();

        try {
            btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
            btn.classList.add('disabled');

            const response = await fetch(`${CHECKOUT_API_URL}/place-order`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    cart: pendingItems, 
                    profile: profileData, 
                    paymentMethod: selectedPaymentMethod,
                    creditCardNumber: creditCardNumber
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Success: Show Thank You UI
                const container = document.getElementById('checkout-container');
                container.innerHTML = `
                    <div class="text-center py-5">
                        <div class="mb-4">
                            <i class="fa fa-check-circle text-success" style="font-size: 80px;"></i>
                        </div>
                        <h2 class="mb-2">ขอบคุณสำหรับการสั่งซื้อ!</h2>
                        <p class="text-muted mb-4">รายการสั่งซื้อของคุณเลขที่ #${result.orderId} ได้รับการบันทึกเรียบร้อยแล้ว</p>
                        <div class="card p-4 bg-light border-0 mb-4" style="border-radius: 15px;">
                            <h5 class="mb-1 text-primary">ยอดชำระทั้งสิ้น</h5>
                            <h3 class="mb-0">฿${result.totalAmount.toLocaleString()}</h3>
                        </div>
                        <button onclick="window.location.href='index.html'" class="btn btn-primary px-5 py-3 mt-3">กลับสู่หน้าหลัก</button>
                    </div>
                `;
                
                // Cleanup Cart after SUCCESS ONLY
                const user = JSON.parse(localStorage.getItem('sunUser'));
                localStorage.removeItem(`cart_${user.username}`);
                localStorage.removeItem(`selected_${user.username}`);
                sessionStorage.removeItem('pendingCheckout');
                
            } else {
                // Server-side Validation Errors
                btn.innerHTML = 'Place an order';
                btn.classList.remove('disabled');

                if (result.error) {
                    // Display specific errors
                    if (result.error.email) {
                        const el = document.getElementById('email-error');
                        el.textContent = result.error.email;
                        el.style.display = 'block';
                    }
                    if (result.error.payment) {
                        const el = document.getElementById('payment-error');
                        el.textContent = result.error.payment;
                        el.style.display = 'block';
                    }
                    if (result.error.stock) {
                        const el = document.getElementById('stock-error');
                        el.textContent = result.error.stock;
                        el.style.display = 'block';
                    }
                    if (result.error.general) {
                        alert(result.error.general);
                    }
                } else {
                    alert(result.message || "เกิดข้อผิดพลาดในการสั่งซื้อ");
                }
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
            btn.innerHTML = 'Place an order';
            btn.classList.remove('disabled');
        }
    }

    // 5. Lifecycle
    document.addEventListener('DOMContentLoaded', () => {
        initCheckout();

        // Event Delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.payment-method-card')) {
                handlePaymentSelection(e);
            }
        });

        document.querySelectorAll('.billing-form input, #terms-check, #creditCardNumber').forEach(input => {
            input.addEventListener('input', () => {
                validateForm();
                saveToLocal(); // 🌟 บันทึกข้อมูลลง LocalStorage ทันทีที่พิมพ์
            });
        });

        document.getElementById('placeOrderBtn')?.addEventListener('click', handlePlaceOrder);
    });
})();
