import fetch from 'node-fetch';

const isLive = process.env.PAYPAL_ENV === 'live';

const PAYPAL_CLIENT = isLive
  ? process.env.PAYPAL_LIVE_CLIENT_ID
  : process.env.PAYPAL_SANDBOX_CLIENT_ID;

const PAYPAL_SECRET = isLive
  ? process.env.PAYPAL_LIVE_SECRET
  : process.env.PAYPAL_SANDBOX_SECRET;

const PAYPAL_API = isLive
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PRICE_PER_STAMP = 14.99;
const DISCOUNT_THRESHOLD = 5;
const DISCOUNT_RATE = 0.10;

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to get PayPal access token');
  return data.access_token;
}

function validateCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) return false;

  for (const item of cart) {
    if (
      typeof item.name !== 'string' ||
      item.name.trim() === '' ||
      item.name.length > 16 ||
      typeof item.quantity !== 'number' ||
      item.quantity < 1 ||
      !Number.isInteger(item.quantity)
    ) {
      return false;
    }
  }
  return true;
}

export async function POST(request) {
  try {
    const { cart } = await request.json();

    if (!validateCart(cart)) {
      return new Response(JSON.stringify({ error: 'Invalid cart data' }), { status: 400 });
    }

    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    let totalAmount = totalQuantity * PRICE_PER_STAMP;
    if (totalQuantity >= DISCOUNT_THRESHOLD) {
      totalAmount = totalAmount * (1 - DISCOUNT_RATE);
    }

    const accessToken = await getAccessToken();

    // Create PayPal order
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'GBP',
            value: totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'GBP',
                value: totalAmount.toFixed(2),
              }
            }
          },
          description: 'Custom Ravioli Stamps',
          items: cart.map(item => ({
            name: item.name,
            unit_amount: {
              currency_code: 'GBP',
              value: PRICE_PER_STAMP.toFixed(2),
            },
            quantity: item.quantity.toString(),
          })),
        }],
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error('PayPal order creation error:', orderData);
      return new Response(JSON.stringify({ error: 'Failed to create PayPal order' }), { status: 500 });
    }

    return new Response(JSON.stringify({ orderID: orderData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}