import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// ✅ CORS: allow your live frontend domain
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

  // ✅ Start with no filters to confirm connection
  const url = `https://api.booqable.com/v1/orders?include=customers,lines&page[number]=${page}&page[size]=25`;

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

try {
  const text = await response.text();
  data = text ? JSON.parse(text) : null;
} catch (parseErr) {
  console.error('❌ Failed to parse JSON:', parseErr);
  data = null;
}


    if (!response.ok || !data) {
      console.error(`❌ Booqable error (${response.status}):`, data || 'No data returned');
      res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
      return res.status(response.status).json({
        success: false,
        error: `Booqable returned ${response.status}`,
        html: JSON.stringify(data)
      });
    }

    const orders = data.data || [];
    const customers = data.included?.filter(c => c.type === 'customers') || [];
    const lines = data.included?.filter(i => i.type === 'lines') || [];

    console.log(`✅ Returned ${orders.length} orders for year ${year}, page ${page}`);
    res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
    res.json({ orders, customers, lines });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
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
    const data = isJson ? await response.json() : null;

    if (!response.ok || !data) {
      console.error(`❌ Booqable update error (${response.status}):`, data || 'No data returned');
      res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
      return res.status(response.status).json({
        success: false,
        error: `Booqable returned ${response.status}`,
        html: JSON.stringify(data)
      });
    }

    res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.sunnydaysevents.com');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('✅ Sunny Helper is running at http://localhost:3000');
});
