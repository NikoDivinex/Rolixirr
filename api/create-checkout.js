// Vercel Serverless Function
// SETUP: Add these in Vercel → Settings → Environment Variables:
//   STRIPE_SECRET_KEY     = sk_live_XXXX
//   STRIPE_PRO_PRICE_ID   = price_XXXX
//   STRIPE_ELITE_PRICE_ID = price_XXXX
//   NEXT_PUBLIC_SITE_URL  = https://rolixir.com

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan } = req.body;
  const priceMap = {
    pro:   process.env.STRIPE_PRO_PRICE_ID,
    elite: process.env.STRIPE_ELITE_PRICE_ID,
  };
  const priceId = priceMap[plan];
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}?success=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}?tab=premium`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};
