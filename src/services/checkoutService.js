const userRepository = require('../repositories/userRepository');
const productRepository = require('../repositories/productRepository');
const orderRepository = require('../repositories/orderRepository');

const calculateTotal = async (cart) => {
    let total = 0;
    const validation = [];

    for (const item of cart) {
        const product = await productRepository.findById(item.productId);
        if (!product) {
            validation.push({ productId: item.productId, error: 'Not found' });
            continue;
        }
        
        const isAvailable = product.stock_quantity >= item.quantity;
        if (isAvailable) {
            total += product.price * item.quantity;
        }
        validation.push({
            productId: item.productId,
            available: isAvailable,
            currentStock: product.stock_quantity
        });
    }
    return { total, validation };
};

const placeOrder = async (userId, username, { cart, profile }) => {
    const itemsToProcess = [];
    let totalAmount = 0;

    for (const item of cart) {
        const prod = await productRepository.findById(item.id || item.productId);
        if (!prod || prod.stock_quantity < item.quantity) {
            return { error: `สินค้า "${prod ? prod.title : 'Unknown'}" สต็อกไม่พอ` };
        }
        const itemTotal = prod.price * item.quantity;
        totalAmount += itemTotal;
        itemsToProcess.push({ ...prod, orderQty: item.quantity, itemTotal });
    }

    const orderId = "ORD-" + Date.now();
    for (const item of itemsToProcess) {
        await productRepository.updateStock(item.id, item.orderQty);
        await orderRepository.create(userId, item.id, item.orderQty, item.itemTotal, orderId);
    }

    await userRepository.upsertProfile(userId, username, profile);

    return { success: true, orderId, totalAmount };
};

const getProfile = async (userId) => {
    const profile = await userRepository.getProfile(userId);
    return profile || {};
};

const saveProfile = async (userId, username, profile) => {
    await userRepository.upsertProfile(userId, username, profile);
    return { success: true };
};

module.exports = {
    calculateTotal,
    placeOrder,
    getProfile,
    saveProfile
};
