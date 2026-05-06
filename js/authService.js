const API_BASE_URL = 'http://localhost:3000/api';

function renderAuthUI() {
    if (!document.getElementById('signinModal')) {
        const modalsHTML = `
        <style>
            .custom-modal .modal-content { border-radius: 15px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            .custom-modal .form-control { border-radius: 8px; background-color: #f8f9fa; }
        </style>
        <!-- Sign In Modal -->
        <div class="modal fade custom-modal" id="signinModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-3">
                    <div class="modal-header border-0">
                        <h5 class="modal-title font-weight-bold">Sign In</h5>
                        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                    </div>
                            <form id="signinForm">
                                <div class="modal-body pb-0">
                                    <div id="signinAlert" class="alert d-none"></div>
                                    <div class="form-group">
                                        <label class="small text-muted">Email Address</label>
                                        <input type="email" class="form-control py-4" placeholder="Enter email" autocomplete="username" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="small text-muted">Password</label>
                                        <input type="password" class="form-control py-4" placeholder="••••••••" autocomplete="current-password" required>
                                    </div>
                                </div>
                                <div class="modal-footer border-0 px-4 pb-4">
                                    <button type="submit" id="signinSubmitBtn" class="btn btn-primary btn-block py-3">Sign In</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <!-- Sign Up Modal -->
                <div class="modal fade custom-modal" id="signupModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content p-3">
                            <div class="modal-header border-0">
                                <h5 class="modal-title font-weight-bold">Create Account</h5>
                                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                            </div>
                            <form id="signupForm">
                                <div class="modal-body pb-0">
                                    <div id="signupAlert" class="alert d-none"></div>
                                    <div class="form-group">
                                        <label class="small text-muted">Username</label>
                                        <input type="text" class="form-control py-4" autocomplete="username" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="small text-muted">Email Address</label>
                                        <input type="email" class="form-control py-4" autocomplete="email" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="small text-muted">Password</label>
                                        <input type="password" class="form-control py-4" autocomplete="new-password" required>
                                    </div>
                                </div>
                        <div class="modal-footer border-0 px-4 pb-4">
                            <button type="submit" id="signupSubmitBtn" class="btn btn-primary btn-block py-3">Sign Up</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalsHTML);
    }

    const regContainer = document.querySelector('.reg p.mb-0');
    if (regContainer) {
        regContainer.innerHTML = `<a href="#" class="mr-2" id="signupBtn" data-toggle="modal" data-target="#signupModal">Sign Up</a> <a href="#" id="authBtn" data-toggle="modal" data-target="#signinModal">Sign In</a>`;
    }
}

// ==========================================
// ควบคุมสิทธิ์การเข้าถึง (Auth Guard & UI State)
// ==========================================
function updateUIState() {
    const userString = localStorage.getItem('sunUser');
    const authBtn = document.getElementById('authBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    const currentPage = window.location.pathname.split('/').pop();
    const isIndexPage = (currentPage === 'index.html' || currentPage === '' || currentPage === '/');

    if (userString) {
        const user = JSON.parse(userString);
        if(authBtn) {
            authBtn.innerHTML = `<span class="fa fa-user mr-1"></span> Hi, ${user.username} (Sign Out)`;
            authBtn.removeAttribute('data-toggle');
            authBtn.onclick = () => {
                localStorage.removeItem('sunToken');
                localStorage.removeItem('sunUser');
                window.location.href = 'index.html'; 
            };
        }
        if(signupBtn) signupBtn.style.display = 'none';

    } else {
        if(authBtn) authBtn.innerHTML = "Sign In";
        if(signupBtn) signupBtn.style.display = 'inline';

        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('.html') && !href.includes('index.html')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    // 🌟 เปลี่ยนข้อความให้เข้ากับการเด้งหน้า Sign Up
                    alert("กรุณาสมัครสมาชิกก่อนเข้าชมหน้านี้"); 
                    // 🌟 เปลี่ยนจาก signinModal เป็น signupModal
                    $('#signupModal').modal('show'); 
                });
            }
        });

        if (!isIndexPage) {
            // 🌟 เปลี่ยนข้อความแจ้งเตือนกรณีพิมพ์ URL เข้ามาตรงๆ ด้วย
            alert("กรุณาสมัครสมาชิกก่อนเข้าชมหน้านี้"); 
            if (window.history.length > 1) {
                window.history.back(); 
            } else {
                window.location.href = 'index.html'; 
            }
        }
    }
}

async function handleSignUp(event) {
    event.preventDefault();
    const form = event.target; 
    const btn = form.querySelector('button[type="submit"]');
    const alertBox = form.querySelector('.alert');
    
    const inputs = form.querySelectorAll('input');
    const username = inputs[0].value.trim();
    const email = inputs[1].value.trim(); 
    const password = inputs[2].value.trim();

    btn.disabled = true;
    btn.innerHTML = 'Creating...';
    alertBox.className = 'alert d-none'; 

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();

        if (response.ok) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = data.message;
            setTimeout(() => {
                $('#signupModal').modal('hide');
                $('#signinModal').modal('show');
                form.reset();
            }, 1500);
        } else {
            alertBox.className = 'alert alert-warning';
            alertBox.textContent = data.message;
        }
    } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = "เชื่อมต่อไม่ได้ กรุณาลองใหม่";
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign Up';
    }
}

async function handleSignin(event) {
    event.preventDefault();
    const form = event.target; 
    const btn = form.querySelector('button[type="submit"]');
    const alertBox = form.querySelector('.alert');
    
    const inputs = form.querySelectorAll('input');
    // เปลี่ยนจาก identifier เป็น email เพื่อให้ตรงกับ Backend
    const email = inputs[0].value.trim();
    const password = inputs[1].value.trim();

    btn.disabled = true;
    btn.innerHTML = 'Authenticating...';
    alertBox.className = 'alert d-none';

    try {
        // เปลี่ยน Endpoint จาก /signin เป็น /login
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();

        // ตรวจสอบ HTTP Status ว่าเป็น 200 (สำเร็จ) หรือ 401 (Unauthorized)
        if (response.status === 200) {
            localStorage.setItem('sunToken', data.token);
            localStorage.setItem('sunUser', JSON.stringify(data.user));
            $('#signinModal').modal('hide');
            window.location.reload(); 
        } else if (response.status === 401) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง (Unauthorized)";
        } else {
            alertBox.className = 'alert alert-warning';
            alertBox.textContent = data.message || "เกิดข้อผิดพลาด";
        }
    } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    renderAuthUI();
    updateUIState();
    document.getElementById('signinForm')?.addEventListener('submit', handleSignin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignUp);
    
    // 🌟 ดักจับ Null Error อย่างสมบูรณ์
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const form = e.target.closest('form');
            if (form) { // ต้องมีเช็ค if (form) เสมอ เพื่อป้องกัน Error หน้าตาราง Cart
                const alertBox = form.querySelector('.alert');
                if (alertBox) alertBox.classList.add('d-none');
            }
        });
    });
});

// ==========================================
// E-commerce 01: Master Cart (ระบบแยกตะกร้าตาม User)
// ==========================================

// 🌟 1. ตรวจสอบว่าใครล็อกอินอยู่ เพื่อสร้างตะกร้าส่วนตัว
const currentUser = JSON.parse(localStorage.getItem('sunUser'));
// ถ้าล็อกอินแล้วใช้ชื่อเช่น 'cart_sun' ถ้ายังไม่ล็อกอินใช้ 'cart_guest'
const CART_KEY = currentUser ? `cart_${currentUser.username}` : 'cart_guest';

// 🌟 2. ดึงข้อมูลตะกร้าเฉพาะของ User คนนั้นๆ
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let products = [];

// 3. โหลดข้อมูลเมื่อเปิดหน้าเว็บ
const initCart = async () => {
    try {
        products = await (await fetch('data/products.json')).json();
        updateUI();
    } catch (err) { console.error("Error loading products:", err); }
};

// 4. จัดการข้อมูลตะกร้า (เพิ่ม/ลบ)
window.handleCartAction = (action, id) => {
    if (action === 'ADD') {
        const item = cart.find(i => i.productId === id);
        item ? item.quantity++ : cart.push({ productId: id, quantity: 1 });
    } else if (action === 'REMOVE') {
        cart = cart.filter(i => i.productId !== id);
    }
    // 🌟 บันทึกลงตะกร้าส่วนตัว
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateUI();
};

// 5. วาด UI ตารางและ Dropdown
const updateUI = () => {
    const badge = document.querySelector('.btn-cart small');
    if (badge) badge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);

    if (!products.length) return; 

    const details = cart.map(c => ({ ...products.find(p => p.id === c.productId), qty: c.quantity })).filter(i => i.id);

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

    const tbody = document.querySelector('.table tbody');
    if (tbody) {
        tbody.innerHTML = details.length
            ? details.map(i => `
                <tr class="alert">
                    <td><label class="checkbox-wrap"><input type="checkbox" checked><span class="checkmark"></span></label></td>
                    <td><div class="img" style="background-image: url(${i.imageUrl});"></div></td>
                    <td><div class="email"><span>${i.title}</span><span>${i.category}</span></div></td>
                    <td>฿${i.price.toLocaleString()}</td>
                    <td><input type="number" class="form-control text-center px-2 qty-input" data-id="${i.id}" value="${i.qty}" min="1" style="width:80px; background:#fff; border: 1px solid #e6e6e6; border-radius: 5px;"></td>
                    <td>฿${(i.price * i.qty).toLocaleString()}</td>
                    <td><button type="button" class="close" onclick="handleCartAction('REMOVE', ${i.id})"><span aria-hidden="true"><i class="fa fa-close"></i></span></button></td>
                </tr>`).join('')
            : '<tr><td colspan="7" class="text-center py-5">ตะกร้าว่างเปล่า</td></tr>';
    }
    
    calculateCheckoutTotal();
};

// 6. ระบบคำนวณราคาก่อนชำระเงิน
const calculateCheckoutTotal = () => {
    // 🌟 ดักจับ: ถ้าไม่มีตารางตะกร้า (เช่นหน้า Checkout) ไม่ต้องคำนวณทับ
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;

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

// 7. ติดตั้งตัวดักจับเหตุการณ์
document.addEventListener('DOMContentLoaded', () => {
    initCart();

    document.addEventListener('click', e => {
        const btn = e.target.closest('.add-to-cart');
        if (btn) {
            e.preventDefault();
            const id = +btn.dataset.id;
            handleCartAction('ADD', id);
            alert(`เพิ่มสินค้าลงตะกร้าแล้ว`);
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.matches('.table tbody input[type="checkbox"]')) {
            calculateCheckoutTotal();
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.matches('.qty-input')) {
            const inputElement = e.target;
            const id = parseInt(inputElement.dataset.id);
            let newQty = parseInt(inputElement.value);

            if (newQty > 0) {
                const item = cart.find(i => i.productId === id);
                if (item) {
                    item.quantity = newQty;
                    // 🌟 บันทึกลงตะกร้าส่วนตัว
                    localStorage.setItem(CART_KEY, JSON.stringify(cart));
                    
                    const badge = document.querySelector('.btn-cart small');
                    if (badge) badge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);

                    const row = inputElement.closest('tr');
                    const priceText = row.querySelector('td:nth-child(4)').textContent;
                    const price = parseFloat(priceText.replace(/[^0-9.-]+/g, ""));
                    const rowTotalCell = row.querySelector('td:nth-child(6)');
                    rowTotalCell.textContent = '฿' + (price * newQty).toLocaleString();

                    calculateCheckoutTotal();
                }
            }
        }
    });
});