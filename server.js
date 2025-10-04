import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const BOOQABLE_API_KEY = 'c754b2bb04d05bbdb144ca02ef8f2c945e2a6b33cb5a476806ba8f21bca4c3cd'; // Replace with your actual key

app.get('/orders', async (req, res) => {
  const page = req.query.page || 1;
  const year = req.query.year || new Date().getFullYear();

  const url = `https://api.booqable.com/v1/orders?include=customers,lines` +
              `&filter[starts_at][gte]=${year}-01-01` +
              `&filter[starts_at][lte]=${year}-12-31` +
              `&page[number]=${page}&page[size]=25`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BOOQABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok || !isJson) {
      const errorText = await response.text();
      console.error(`❌ Booqable error (${response.status}):`, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Booqable returned ${response.status}`,
        html: errorText
      });
    }

    const data = await response.json();

    const orders = data.data || [];
    const customers = data.included?.filter(c => c.type === 'customers') || [];
    const lines = data.included?.filter(i => i.type === 'lines') || [];

    res.json({ orders, customers, lines });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/update-order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Missing status in request body' });
  }

  try {
    const response = await fetch(`https://api.booqable.com/v1/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${BOOQABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order: { status } })
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok || !isJson) {
      const errorText = await response.text();
      console.error(`❌ Booqable update error (${response.status}):`, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Booqable returned ${response.status}`,
        html: errorText
      });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log('✅ Sunny Helper is running at http://localhost:3000');
});
