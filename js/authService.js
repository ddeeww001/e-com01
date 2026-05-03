// ==========================================
// ควบคุม UX/UI (Dynamic Rendering) และเชื่อมต่อ API
// ==========================================

const API_BASE_URL = 'http://localhost:3000/api';

// 1. ฟังก์ชันวาด UI ลงบนหน้า HTML อัตโนมัติ
function renderAuthUI() {
    if (!document.getElementById('signinModal')) {
        const modalsHTML = `
        <style>
            .custom-modal .modal-content { border-radius: 15px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            .custom-modal .form-control { border-radius: 8px; background-color: #f8f9fa; }
            .custom-modal .form-control:focus { background-color: #fff; border-color: #b7472a; box-shadow: 0 0 0 0.2rem rgba(183, 71, 42, 0.25); }
        </style>

        <!-- Sign In Modal -->
        <div class="modal fade custom-modal" id="signinModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title font-weight-bold">Sign In to Your Account</h5>
                        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                    </div>
                    <form id="signinForm">
                        <div class="modal-body pb-0">
                            <div id="signinAlert" class="alert d-none"></div>
                            <div class="form-group">
                                <label class="text-muted">Username</label>
                                <input type="text" id="signinUser" class="form-control px-3 py-4" required>
                            </div>
                            <div class="form-group">
                                <label class="text-muted">Password</label>
                                <input type="password" id="signinPass" class="form-control px-3 py-4" required>
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
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title font-weight-bold">Create Account</h5>
                        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                    </div>
                    <form id="signupForm">
                        <div class="modal-body pb-0">
                            <div id="signupAlert" class="alert d-none"></div>
                            <div class="form-group">
                                <label class="text-muted">Username</label>
                                <input type="text" id="regUser" class="form-control px-3 py-4" required>
                            </div>
                            <div class="form-group">
                                <label class="text-muted">Password</label>
                                <input type="password" id="regPass" class="form-control px-3 py-4" required>
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

    // ฝังปุ่มลงไปที่เมนูด้านบน
    const regContainer = document.querySelector('.reg p.mb-0');
    if (regContainer) {
        regContainer.innerHTML = `
            <a href="#" class="mr-2" id="signupBtn" data-toggle="modal" data-target="#signupModal">Sign Up</a> 
            <a href="#" id="authBtn" data-toggle="modal" data-target="#signinModal">Sign In</a>
        `;
    }
}

// 2. จัดการสถานะการเข้าสู่ระบบ
function updateUIState() {
    const userString = localStorage.getItem('sunUser');
    const authBtn = document.getElementById('authBtn');
    const signupBtn = document.getElementById('signupBtn');
    const productContainer = document.getElementById('product-container'); 
    
    if (userString) {
        const user = JSON.parse(userString);
        if(authBtn) {
            authBtn.innerHTML = `<span class="fa fa-user mr-1"></span> Hi, ${user.username} (Sign Out)`;
            authBtn.removeAttribute('data-toggle');
            authBtn.onclick = () => {
                localStorage.removeItem('sunToken');
                localStorage.removeItem('sunUser');
                window.location.reload(); 
            };
        }
        if(signupBtn) signupBtn.style.display = 'none';
        if(productContainer) productContainer.style.display = 'flex'; 
    } else {
        if(authBtn) authBtn.innerHTML = "Sign In";
        if(signupBtn) signupBtn.style.display = 'inline';
        if(productContainer) productContainer.style.display = 'none';
    }
}

// 3. ระบบ API: Sign Up
async function handleSignUp(event) {
    event.preventDefault();
    const btn = document.getElementById('signupSubmitBtn');
    const alertBox = document.getElementById('signupAlert');
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value.trim();

    btn.disabled = true;
    btn.innerHTML = 'Creating...';
    alertBox.className = 'alert d-none'; 

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = data.message;
            setTimeout(() => {
                $('#signupModal').modal('hide');
                $('#signinModal').modal('show'); // เปลี่ยนให้เด้งไปหน้า Sign In แทน
                document.getElementById('signupForm').reset();
            }, 1500);
        } else {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = data.message;
        }
    } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign Up';
    }
}

// 4. ระบบ API: Sign In
async function handleSignin(event) {
    event.preventDefault();
    const btn = document.getElementById('signinSubmitBtn');
    const alertBox = document.getElementById('signinAlert');
    const username = document.getElementById('signinUser').value.trim();
    const password = document.getElementById('signinPass').value.trim();

    btn.disabled = true;
    btn.innerHTML = 'Authenticating...';
    alertBox.className = 'alert d-none';

    try {
        const response = await fetch(`${API_BASE_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('sunToken', data.token);
            localStorage.setItem('sunUser', JSON.stringify(data.user));
            $('#signinModal').modal('hide');
            window.location.reload(); 
        } else {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = data.message;
        }
    } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
    }
}

// ==========================================
// โหลดทุกอย่างทันทีที่เปิดเว็บ (Initialization)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    renderAuthUI();
    updateUIState();
    
    document.getElementById('signinForm')?.addEventListener('submit', handleSignin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignUp);

    document.getElementById('signinUser')?.addEventListener('input', () => document.getElementById('signinAlert').classList.add('d-none'));
    document.getElementById('signinPass')?.addEventListener('input', () => document.getElementById('signinAlert').classList.add('d-none'));
    document.getElementById('regUser')?.addEventListener('input', () => document.getElementById('signupAlert').classList.add('d-none'));
});