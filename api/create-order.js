import { fetch } from 'undici';

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

// Note: PRICE_PER_STAMP and related discount logic will now primarily
// be calculated based on the 'price' field of each item in the incoming cart,
// which is already determined on the client-side by overlay.js.
// However, for robust server-side validation, you might want to re-validate
// item prices against a known product catalog on the server.
// For this update, we trust the 'price' sent from the client.
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
    // Validate the new, richer item structure
    if (
      typeof item.productName !== 'string' ||
      item.productName.trim() === '' ||
      typeof item.color !== 'string' ||
      typeof item.quantity !== 'number' ||
      item.quantity < 1 ||
      !Number.isInteger(item.quantity) ||
      typeof item.price !== 'number' || // Ensure price is a number
      item.price <= 0 // Ensure price is positive
      // You might add length validations for topLine, bottomLine, dedication if needed
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
      return new Response(JSON.stringify({ error: 'Invalid cart data received from client' }), { status: 400 });
    }

    // Calculate sumOfItems and totalQuantity based on the received cart items' prices
    const sumOfItems = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

    let totalAmount = sumOfItems; // Start with sum of items, then apply discount
    let discountAmount = 0;

    if (totalQuantity >= DISCOUNT_THRESHOLD) {
      discountAmount = totalAmount * DISCOUNT_RATE;
      totalAmount = totalAmount - discountAmount;
    }

    const accessToken = await getAccessToken();

    const orderBody = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'GBP',
          value: totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'GBP',
              value: sumOfItems.toFixed(2),
            },
            discount: {
              currency_code: 'GBP',
              value: discountAmount.toFixed(2),
            }
          }
        },
        description: 'Custom Ravioli Stamps Order', // More generic description for the whole order
        items: cart.map(item => {
          // Construct a more detailed item name/description for PayPal
          let itemName = `${item.productName} (${item.color})`;
          let itemDescriptionParts = [];
          if (item.topLine) itemDescriptionParts.push(`Top: ${item.topLine}`);
          if (item.bottomLine) itemDescriptionParts.push(`Bottom: ${item.bottomLine}`);
          if (item.dedication) itemDescriptionParts.push(`Dedication: ${item.dedication}`);

          let itemDescription = itemDescriptionParts.length > 0
            ? itemDescriptionParts.join(' | ')
            : 'No personalization';

          // PayPal item name has a max length, may need truncation
          if (itemName.length > 127) { // PayPal max length for item name
              itemName = itemName.substring(0, 124) + '...';
          }
          if (itemDescription.length > 127) { // PayPal max length for item description
              itemDescription = itemDescription.substring(0, 124) + '...';
          }

          return {
            name: itemName,
            unit_amount: {
              currency_code: 'GBP',
              value: item.price.toFixed(2), // Use the specific item price
            },
            quantity: item.quantity.toString(),
            description: itemDescription // Add detailed description
          };
        }),
      }],
    };

    // Create PayPal order
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error('PayPal order creation error:', orderData);
      return new Response(JSON.stringify({ error: orderData.message || 'Failed to create PayPal order' }), { status: orderRes.status });
    }

    return new Response(JSON.stringify({ orderID: orderData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), { status: 500 });
  }
}
