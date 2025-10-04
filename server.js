import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BOOQABLE_API_KEY = process.env.BOOQABLE_API_KEY;

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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOOQABLE_API_KEY}`
      },
      body: JSON.stringify({ order: { status } })
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!isJson) {
      const text = await response.text();
      return res.status(500).json({ success: false, error: 'Invalid JSON response', html: text });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Error updating order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log('✅ Sunny Helper is running at http://localhost:3000');
});
