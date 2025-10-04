import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// ✅ CORS: allow your frontend domain
app.use(cors({
  origin: 'https://www.sunnydaysevents.com',
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const BOOQABLE_API_KEY = 'c754b2bb04d05bbdb144ca02ef8f2c945e2a6b33cb5a476806ba8f21bca4c3cd'; // Replace with your actual key

app.get('/orders', async (req, res) => {
  const page = req.query.page || 1;
  const year = req.query.year || new Date().getFullYear();

  const url = `https://sunny-days-events.booqable.com/api/4/orders` +
              `?include=customer` +
              `&filter[starts_at][gte]=${year}-01-01` +
              `&filter[starts_at][lte]=${year}-12-31` +
              `&page[number]=${page}&page[size]=25`;

  console.log(`🔗 Fetching Booqable orders: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BOOQABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data = null;
    const text = await response.text();
    console.log('📦 Raw response text:', text);

    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      console.error('❌ Failed to parse JSON:', parseErr);
    }

    if (!response.ok || !data) {
      console.error(`❌ Booqable error (${response.status}):`, data || 'No data returned');
      res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
      return res.status(response.status).json({
        success: false,
        error: `Booqable returned ${response.status}`,
        html: data ? JSON.stringify(data) : 'Empty response'
      });
    }

    const orders = data.data || [];
    const customers = data.included?.filter(c => c.type === 'customer') || [];

    console.log(`✅ Returned ${orders.length} orders for year ${year}, page ${page}`);
    res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
    res.json({ orders, customers });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/update-order/:id', async (req, res) => {
  const orderId = req.params.id;
  const status = 'started'; // 🔒 Hardcoded status

  const url = `https://sunny-days-events.booqable.com/api/4/orders/${orderId}`;
  console.log(`📤 Updating order ${orderId} to status: ${status}`);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${BOOQABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order: {
          status: status
        }
      })
    });

    const text = await response.text();
    console.log('📦 Booqable response:', text);

    const data = text ? JSON.parse(text) : null;

    if (!response.ok || !data) {
      console.error(`❌ Booqable error (${response.status}):`, data || 'No data returned');
      return res.status(response.status).json({
        success: false,
        error: `Booqable returned ${response.status}`,
        html: data ? JSON.stringify(data) : 'Empty response'
      });
    }

    res.json({ success: true, order: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Sunny Helper is running locally on http://localhost:${port}`);
});

