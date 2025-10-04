import fetch from 'node-fetch';

const BOOQABLE_API_KEY = 'c754b2bb04d05bbdb144ca02ef8f2c945e2a6b33cb5a476806ba8f21bca4c3cd'; // Replace with your actual key

// ✅ Fetch one page of orders
async function testFetchOrders() {
  const url = 'https://api.booqable.com/v1/orders?include=customers,lines&page[number]=1&page[size]=25';

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BOOQABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log('📦 Raw response:', text);

    const data = text ? JSON.parse(text) : null;
    const orders = data?.data || [];

    console.log(`✅ Fetched ${orders.length} orders`);
    return orders;
  } catch (err) {
    console.error('❌ Fetch error:', err);
  }
}

// ✅ Push a status update to one order
async function testUpdateOrder(orderId, newStatus) {
  const url = `https://api.booqable.com/v1/orders/${orderId}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${BOOQABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order: { status: newStatus } })
    });

    const text = await response.text();
    console.log('📤 Update response:', text);

    const data = text ? JSON.parse(text) : null;
    console.log(`✅ Order ${orderId} updated to status: ${newStatus}`);
    return data;
  } catch (err) {
    console.error('❌ Update error:', err);
  }
}

// ✅ Run both tests
(async () => {
  const orders = await testFetchOrders();

  if (orders.length > 0) {
    const firstOrderId = orders[0].id;
    await testUpdateOrder(firstOrderId, 'confirmed'); // Change status as needed
  } else {
    console.log('⚠️ No orders found to update');
  }
})();
