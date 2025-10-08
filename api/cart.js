let cartItems = [];

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(cartItems);
  }

  if (req.method === 'POST') {
    const { gameId, quantity = 1 } = req.body;
    
    const existingItem = cartItems.find(item => item.gameId === gameId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({
        sessionId: 'vercel-session',
        gameId,
        quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    return res.status(200).json({ success: true, cartItems });
  }

  if (req.method === 'DELETE') {
    cartItems = [];
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}