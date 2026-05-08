// ==========================================
// E-commerce 01: Master Cart & User Selection Sync
// ==========================================

(function() {
    // Global state (Localized within IIFE to avoid SyntaxError)
    const currentUser = JSON.parse(localStorage.getItem('sunUser'));
    const CART_KEY = currentUser ? `cart_${currentUser.username}` : 'cart_guest';
    const SELECTED_KEY = currentUser ? `selected_${currentUser.username}` : 'selected_guest';

    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    let products = [];
    let selectedItemIds = JSON.parse(localStorage.getItem(SELECTED_KEY)) || [];

    // 1. Initial Load
    async function initCart() {
        try {
            const response = await fetch('http://localhost:3000/api/products');
            if (!response.ok) throw new Error("Failed to load products from API");
            products = await response.json();
            
            // Filter out IDs that are no longer in the cart
            selectedItemIds = selectedItemIds.filter(id => cart.some(c => c.productId === id));
            
            updateUI();
        } catch (err) { 
            console.error("Error loading products:", err); 
            updateUI();
        }
    }

    // 2. Cart Actions
    window.handleCartAction = function(action, id) {
        if (action === 'ADD') {
            const item = cart.find(i => i.productId === id);
            item ? item.quantity++ : cart.push({ productId: id, quantity: 1 });
            
            const prod = products.find(p => p.id === id);
            if (prod && prod.stock_quantity > 0 && !selectedItemIds.includes(id)) {
                selectedItemIds.push(id);
            }
        } else if (action === 'REMOVE') {
            cart = cart.filter(i => i.productId !== id);
            selectedItemIds = selectedItemIds.filter(sid => sid !== id);
        }
        
        saveState();
        updateUI();
    };

    function saveState() {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        localStorage.setItem(SELECTED_KEY, JSON.stringify(selectedItemIds));
    }

    // 3. UI Rendering
    function updateUI() {
        const badge = document.querySelector('.btn-cart small');
        if (badge) {
            const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
            badge.textContent = totalQty;
        }

        // --- Update Navbar Dropdown ---
        const dropdownMenu = document.querySelector('.dropdown-menu-right');
        if (dropdownMenu) {
            const dropdownDetails = cart.map(c => {
                const prod = products.find(p => p.id === c.productId);
                return prod ? { ...prod, qty: c.quantity } : null;
            }).filter(i => i !== null);

            let dropdownHTML = '';
            if (dropdownDetails.length === 0) {
                dropdownHTML = '<div class="dropdown-item text-center">ไม่มีสินค้าในตะกร้า</div>';
            } else {
                dropdownHTML = dropdownDetails.slice(0, 3).map(i => `
                    <div class="dropdown-item d-flex align-items-start">
                        <div class="img" style="background-image: url(${i.imageUrl});"></div>
                        <div class="text pl-3">
                            <h4>${i.title}</h4>
                            <p class="mb-0"><span class="price">฿${i.price.toLocaleString()}</span><span class="quantity ml-3">จำนวน: ${i.qty}</span></p>
                        </div>
                    </div>
                `).join('');
                
                if (dropdownDetails.length > 3) {
                    dropdownHTML += `<div class="dropdown-item text-center text-muted small">และอีก ${dropdownDetails.length - 3} รายการ...</div>`;
                }
            }

            dropdownHTML += `
                <a class="dropdown-item text-center btn-link d-block w-100" href="cart.html">
                    View All
                    <span class="ion-ios-arrow-round-forward"></span>
                </a>
            `;
            dropdownMenu.innerHTML = dropdownHTML;
        }

        const tbody = document.querySelector('.table tbody');
        if (!tbody) return;

        if (!products.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5">กำลังโหลดข้อมูลสินค้า...</td></tr>';
            return;
        }

        const details = cart.map(c => {
            const prod = products.find(p => p.id === c.productId);
            return prod ? { ...prod, qty: c.quantity } : null;
        }).filter(i => i !== null);

        if (details.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5">ตะกร้าว่างเปล่า</td></tr>';
        } else {
            tbody.innerHTML = details.map(i => {
                const isSoldOut = i.stock_quantity <= 0;
                const isSelected = selectedItemIds.includes(i.id);
                return `
                <tr class="alert ${isSoldOut ? 'sold-out-row' : ''}">
                    <td>
                        <label class="checkbox-wrap">
                            <input type="checkbox" ${isSoldOut ? 'disabled' : (isSelected ? 'checked' : '')} 
                                class="item-smart-checkbox" data-id="${i.id}">
                            <span class="checkmark"></span>
                        </label>
                    </td>
                    <td>
                        <div class="img-container">
                            <div class="img ${isSoldOut ? 'grayscale' : ''}" style="background-image: url(${i.imageUrl});"></div>
                            ${isSoldOut ? '<div class="sold-out-badge">SOLD OUT</div>' : ''}
                        </div>
                    </td>
                    <td>
                        <div class="email">
                            <span class="${isSoldOut ? 'text-muted' : ''}">${i.title}</span>
                            <span class="${isSoldOut ? 'text-muted' : ''}">${i.category}</span>
                        </div>
                    </td>
                    <td class="${isSoldOut ? 'text-muted' : ''}">฿${i.price.toLocaleString()}</td>
                    <td>
                        <input type="number" class="form-control text-center px-2 qty-input" 
                            data-id="${i.id}" value="${i.qty}" min="1" 
                            ${isSoldOut ? 'disabled' : ''}
                            style="width:80px; background:#fff; border: 1px solid #e6e6e6; border-radius: 5px; ${isSoldOut ? 'opacity:0.5;' : ''}">
                    </td>
                    <td class="${isSoldOut ? 'text-muted' : ''}">฿${(i.price * i.qty).toLocaleString()}</td>
                    <td>
                        <button type="button" class="close" onclick="handleCartAction('REMOVE', ${i.id})">
                            <span aria-hidden="true"><i class="fa fa-close"></i></span>
                        </button>
                    </td>
                </tr>`;
            }).join('');
        }
        
        calculateTotalPrice();
    }

    // 4. Calculation & Validation Logic
    function calculateTotalPrice() {
        let subtotal = 0;
        const itemsToBuy = [];
        let hasOutOfStockSelected = false;

        selectedItemIds.forEach(id => {
            const cartItem = cart.find(c => c.productId === id);
            const product = products.find(p => p.id === id);
            
            if (cartItem && product) {
                if (product.stock_quantity > 0) {
                    subtotal += product.price * cartItem.quantity;
                    if (cartItem.quantity > 0) {
                        itemsToBuy.push({ 
                            id: product.id, 
                            productId: product.id,
                            title: product.title, 
                            price: product.price, 
                            quantity: cartItem.quantity,
                            stock_quantity: product.stock_quantity
                        });
                    }
                } else {
                    hasOutOfStockSelected = true;
                }
            }
        });

        const deliveryFee = 0;
        const discount = 0;
        const total = subtotal + deliveryFee - discount;

        const cartTotalContainer = document.querySelector('.cart-total');
        if (cartTotalContainer) {
            const spans = cartTotalContainer.querySelectorAll('p.d-flex span:nth-child(2)');
            if (spans.length >= 4) {
                spans[0].textContent = '฿' + subtotal.toLocaleString();
                spans[1].textContent = '฿' + deliveryFee.toLocaleString();
                spans[2].textContent = '฿' + discount.toLocaleString();
                spans[3].textContent = '฿' + total.toLocaleString();
            }
        }

        const checkoutBtn = document.querySelector('.cart-wrap a.btn-primary');
        if (checkoutBtn) {
            const isReady = itemsToBuy.length > 0 && !hasOutOfStockSelected && total > 0;

            if (isReady) {
                checkoutBtn.classList.remove('disabled');
                checkoutBtn.style.pointerEvents = 'auto';
                checkoutBtn.style.opacity = '1';
                checkoutBtn.style.background = '#f96d00';
                checkoutBtn.style.borderColor = '#f96d00';
                checkoutBtn.style.color = '#fff';
                checkoutBtn.style.cursor = 'pointer';
            } else {
                checkoutBtn.classList.add('disabled');
                checkoutBtn.style.pointerEvents = 'none';
                checkoutBtn.style.opacity = '0.5';
                checkoutBtn.style.background = '#6c757d';
                checkoutBtn.style.borderColor = '#6c757d';
                checkoutBtn.style.color = '#fff';
                checkoutBtn.style.cursor = 'not-allowed';
            }
        }
    }

    // 5. Interaction Handlers
    async function handleCheckboxClick(e) {
        const checkbox = e.target.closest('.item-smart-checkbox');
        if (!checkbox) return;

        e.preventDefault();

        const id = parseInt(checkbox.dataset.id);
        const token = localStorage.getItem('sunToken');

        if (!token) {
            alert("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
            if (typeof $ !== 'undefined' && $('#signinModal').length) {
                $('#signinModal').modal('show');
            }
            return;
        }

        const isCurrentlySelected = selectedItemIds.includes(id);

        if (isCurrentlySelected) {
            selectedItemIds = selectedItemIds.filter(sid => sid !== id);
        } else {
            const product = products.find(p => p.id === id);
            if (product && product.stock_quantity > 0) {
                selectedItemIds.push(id);
            } else {
                alert("ขออภัย สินค้านี้หมดสต็อกแล้ว ไม่สามารถเลือกเพื่อชำระเงินได้");
                return;
            }
        }

        saveState();
        updateUI();
    }

    function handleQuantityChange(e) {
        if (e.target.matches('.qty-input')) {
            const id = parseInt(e.target.dataset.id);
            let val = parseInt(e.target.value);
            
            const item = cart.find(i => i.productId === id);
            if (item) {
                if (isNaN(val) || val < 1) {
                    val = 1;
                    e.target.value = 1;
                }
                item.quantity = val;
                saveState();
                const product = products.find(p => p.id === id);
                if (product) {
                    const row = e.target.closest('tr');
                    if (row) {
                        const totalCell = row.querySelector('td:nth-child(6)');
                        if (totalCell) totalCell.textContent = '฿' + (product.price * val).toLocaleString();
                    }
                }
                calculateTotalPrice();
            }
        }
    }

    function handleCheckoutClick(e) {
        const subtotalText = document.querySelector('.cart-total p.total-price span:last-child')?.textContent || "0";
        const subtotal = parseFloat(subtotalText.replace(/[^\d.-]/g, '') || 0);
        
        const selectedProducts = products.filter(p => selectedItemIds.includes(p.id));
        const itemsToBuy = selectedProducts.map(p => {
            const cartItem = cart.find(c => c.productId === p.id);
            return { 
                id: p.id,
                productId: p.id,
                title: p.title,
                price: p.price,
                quantity: cartItem ? cartItem.quantity : 0,
                stock_quantity: p.stock_quantity
            };
        });

        const hasSelection = itemsToBuy.length > 0;
        const allInStock = hasSelection && itemsToBuy.every(i => i.stock_quantity > 0);

        if (!hasSelection || !allInStock || subtotal <= 0) {
            e.preventDefault();
            e.stopPropagation();
            alert("กรุณาเลือกสินค้าที่มีในสต็อกอย่างน้อย 1 รายการและมียอดรวมมากกว่า 0 บาทก่อนชำระเงิน");
            calculateTotalPrice();
            return false;
        }
        
        sessionStorage.setItem('pendingCheckout', JSON.stringify(itemsToBuy));
    }

    // 6. Lifecycle Initialization
    document.addEventListener('DOMContentLoaded', () => {
        initCart();

        document.addEventListener('click', e => {
            const btn = e.target.closest('.add-to-cart');
            if (btn) {
                e.preventDefault();
                const id = parseInt(btn.dataset.id);
                window.handleCartAction('ADD', id);
                alert(`เพิ่มสินค้าลงตะกร้าแล้ว`);
            }
        });

        document.addEventListener('click', handleCheckboxClick);
        document.addEventListener('input', handleQuantityChange);
        
        const checkoutBtn = document.querySelector('.cart-wrap a.btn-primary');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckoutClick);
        }
    });
})();
