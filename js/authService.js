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
                                <label class="small text-muted">Email or Username</label>
                                <input type="text" class="form-control py-4" placeholder="Enter email or username" required>
                            </div>
                            <div class="form-group">
                                <label class="small text-muted">Password</label>
                                <input type="password" class="form-control py-4" placeholder="••••••••" required>
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
                                <input type="text" class="form-control py-4" required>
                            </div>
                            <div class="form-group">
                                <label class="small text-muted">Email Address</label>
                                <input type="email" class="form-control py-4" required>
                            </div>
                            <div class="form-group">
                                <label class="small text-muted">Password</label>
                                <input type="password" class="form-control py-4" required>
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
    
    // เช็คว่าตอนนี้อยู่หน้าอะไร
    const currentPage = window.location.pathname.split('/').pop();
    const isIndexPage = (currentPage === 'index.html' || currentPage === '' || currentPage === '/');

    if (userString) {
        // --- กรณี: เข้าสู่ระบบแล้ว ---
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
        // --- กรณี: ยังไม่เข้าสู่ระบบ ---
        if(authBtn) authBtn.innerHTML = "Sign In";
        if(signupBtn) signupBtn.style.display = 'inline';

        // 🌟 ปรับปรุงใหม่ 1: ดักจับการคลิกทุกลิงก์ที่พาไปหน้าอื่น เพื่อให้ "อยู่หน้าเดิม"
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            
            // ถ้าลิงก์พาไปหน้าที่มี .html และไม่ใช่หน้า index.html (บล็อกทุกหน้ายกเว้นหน้าแรก)
            if (href && href.includes('.html') && !href.includes('index.html')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault(); // 🛑 สั่งให้หยุด! ไม่ต้องโหลดเปลี่ยนหน้า (ให้อยู่หน้าเดิม)
                    alert("กรุณาเข้าสู่ระบบก่อนเข้าชมหน้านี้");
                    $('#signinModal').modal('show'); // เปิดกล่องล็อกอินขึ้นมาให้ทันที
                });
            }
        });

        // 🚨 ปรับปรุงใหม่ 2: ดักจับกรณีคนดื้อ "พิมพ์ URL" เข้าหน้าอื่นตรงๆ (เช่นพิมพ์ /cart.html เอง)
        // เราจะเตือน แล้วใช้คำสั่งกดย้อนกลับ (Back) แทนการเตะกลับ index แบบดื้อๆ
        if (!isIndexPage) {
            alert("กรุณาเข้าสู่ระบบก่อนเข้าชมหน้านี้");
            if (window.history.length > 1) {
                window.history.back(); // สั่งให้เบราว์เซอร์กดย้อนกลับไปหน้าเดิม
            } else {
                window.location.href = 'index.html'; // ถ้าเปิดแท็บใหม่เข้ามา ค่อยส่งไปหน้าแรก
            }
        }
    }
}

async function handleSignUp(event) {
    event.preventDefault();
    const form = event.target; // 🌟 ดึงฟอร์มที่คุณกำลังกดเป๊ะๆ
    const btn = form.querySelector('button[type="submit"]');
    const alertBox = form.querySelector('.alert');
    
    // ดึงค่า Input ตามลำดับที่อยู่ในฟอร์ม หมดปัญหา ID ชนกัน
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
    const form = event.target; // 🌟 ดึงฟอร์มที่คุณกำลังกดเป๊ะๆ
    const btn = form.querySelector('button[type="submit"]');
    const alertBox = form.querySelector('.alert');
    
    // ดึงค่า Input ตามลำดับ
    const inputs = form.querySelectorAll('input');
    const identifier = inputs[0].value.trim();
    const password = inputs[1].value.trim();

    btn.disabled = true;
    btn.innerHTML = 'Authenticating...';
    alertBox.className = 'alert d-none';

    try {
        const response = await fetch(`${API_BASE_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
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
        alertBox.textContent = "เชื่อมต่อไม่ได้ กรุณาลองใหม่";
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
    
    // ซ่อน Alert เมื่อเริ่มพิมพ์
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const alertBox = e.target.closest('form').querySelector('.alert');
            if (alertBox) alertBox.classList.add('d-none');
        });
    });
});