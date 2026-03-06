// Vercel Serverless Function — Stripe webhook handler
// SETUP: Add in Vercel → Settings → Environment Variables:
//   STRIPE_SECRET_KEY     = sk_live_XXXX
//   STRIPE_WEBHOOK_SECRET = whsec_XXXX
// In Stripe Dashboard → Developers → Webhooks → Add endpoint:
//   URL: https://rolixir.com/api/webhook

const Stripe = require('stripe');

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('New subscriber:', event.data.object.customer);
      break;
    case 'customer.subscription.deleted':
      console.log('Cancelled:', event.data.object.customer);
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object.customer);
      break;
  }

  res.status(200).json({ received: true });
};
