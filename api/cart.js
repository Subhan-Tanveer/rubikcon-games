// Simple session-based cart storage
const cartSessions = new Map();

function getSessionId(req) {
  // Use a simple session ID from headers or create one
  return req.headers['x-session-id'] || 'default-session';
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Get games data to join with cart items
    const games = [
      {
        id: 1,
        title: "Crypto Charades",
        slug: "crypto-charade",
        price: 1200,
        currency: "NGN",
        description: "How well do you REALLY know crypto lingo? Act out Bitcoin, DeFi...",
        image: "/images/card1.png",
        category: "card"
      },
      {
        id: 2,
        title: "Blocks and Hashes",
        slug: "blocks-and-hashes",
        price: 1200,
        currency: "NGN",
        description: "Master the fundamentals of blockchain technology with this...",
        image: "/images/card21.png",
        category: "card"
      },
      {
        id: 3,
        title: "Into the Cryptoverse",
        slug: "into-the-cryptoverse",
        price: 1200,
        currency: "NGN",
        description: "Journey through the multiverse of cryptocurrency in this never-skip ca...",
        image: "/images/card3.png",
        category: "card"
      },
      {
        id: 4,
        title: "Web3 Trivia Online",
        slug: "web3-trivia-online",
        price: 0,
        currency: "NGN",
        description: "Play the ultimate Web3 trivia game online with friends from around the...",
        image: "/images/card4.png",
        category: "online"
      }
    ];
    
    // Get cart items for this session
    const sessionId = getSessionId(req);
    const cartItems = cartSessions.get(sessionId) || [];
    
    // Join cart items with game data
    const cartWithGames = cartItems.map(item => {
      const game = games.find(g => g.id === item.gameId);
      return {
        ...item,
        game: game
      };
    });
    
    return res.status(200).json(cartWithGames);
  }

  if (req.method === 'POST') {
    const { gameId, quantity = 1 } = req.body;
    const sessionId = getSessionId(req);
    
    // Get or create cart for this session
    if (!cartSessions.has(sessionId)) {
      cartSessions.set(sessionId, []);
    }
    
    const cartItems = cartSessions.get(sessionId);
    const existingItem = cartItems.find(item => item.gameId === gameId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({
        id: Date.now(),
        sessionId,
        gameId,
        quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    cartSessions.set(sessionId, cartItems);
    return res.status(200).json({ success: true, cartItems });
  }

  if (req.method === 'DELETE') {
    const sessionId = getSessionId(req);
    cartSessions.set(sessionId, []);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}