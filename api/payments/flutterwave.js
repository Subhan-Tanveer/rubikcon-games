export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { amount, currency, customer_email, customer_name, customer_phone } = req.body;
      
      // Check if required environment variables exist
      if (!process.env.FLUTTERWAVE_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          error: 'Flutterwave configuration missing'
        });
      }

      const paymentData = {
        tx_ref: `rubikcon-${Date.now()}`,
        amount: amount,
        currency: currency || 'NGN',
        redirect_url: `${process.env.FRONTEND_URL || 'https://rubikcon-games.vercel.app'}/payment-success`,
        customer: {
          email: customer_email,
          name: customer_name,
          phonenumber: customer_phone
        },
        customizations: {
          title: 'Rubikcon Games',
          description: 'Game Purchase',
          logo: `${process.env.FRONTEND_URL || 'https://rubikcon-games.vercel.app'}/logo.png`
        }
      };

      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.status === 'success') {
        return res.status(200).json({
          success: true,
          payment_url: result.data.link,
          tx_ref: paymentData.tx_ref
        });
      } else {
        console.error('Flutterwave API Response:', result);
        return res.status(400).json({
          success: false,
          error: result.message || 'Payment initialization failed',
          details: result
        });
      }
    } catch (error) {
      console.error('Flutterwave API Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Payment service error',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}