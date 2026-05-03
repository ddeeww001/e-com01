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
                                <label class="small text-muted">Username</label>
                                <input type="text" id="signinUser" class="form-control py-4" required>
                            </div>
                            <div class="form-group">
                                <label class="small text-muted">Password</label>
                                <!-- ปรับเป็น type="password" เพื่อความปลอดภัย -->
                                <input type="password" id="signinPass" class="form-control py-4" placeholder="••••••••" required>
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
                                <input type="text" id="regUser" class="form-control py-4" required>
                            </div>
                            <div class="form-group">
                                <label class="small text-muted">Email Address</label>
                                <!-- เพิ่มช่อง Email -->
                                <input type="email" id="regEmail" class="form-control py-4" placeholder="example@mail.com" required>
                            </div>
                            <div class="form-group">
                                <label class="small text-muted">Password</label>
                                <!-- ปรับเป็น type="password" เพื่อความปลอดภัย -->
                                <input type="password" id="regPass" class="form-control py-4" placeholder="Min. 6 characters" required>
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
        regContainer.innerHTML = `
            <a href="#" class="mr-2" id="signupBtn" data-toggle="modal" data-target="#signupModal">Sign Up</a> 
            <a href="#" id="authBtn" data-toggle="modal" data-target="#signinModal">Sign In</a>
        `;
    }
}

// ปรับปรุงฟังก์ชันส่งข้อมูล Sign Up ให้ส่ง Email ไปด้วย
async function handleSignUp(event) {
    event.preventDefault();
    const btn = document.getElementById('signupSubmitBtn');
    const alertBox = document.getElementById('signupAlert');
    const username = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim(); // รับค่า email
    const password = document.getElementById('regPass').value.trim();

    btn.disabled = true;
    btn.innerHTML = 'Creating...';

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }) // ส่งไป backend
        });
        const data = await response.json();

        if (response.ok) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = data.message;
            setTimeout(() => {
                $('#signupModal').modal('hide');
                $('#signinModal').modal('show');
                document.getElementById('signupForm').reset();
            }, 1500);
        } else {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = data.message;
        }
    } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = "Error connecting to server";
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign Up';
    }
}

// ... ส่วนที่เหลือของโค้ดคงเดิม ...

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