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