export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const games = [
      {
        id: 1,
        title: "Crypto Charades",
        slug: "crypto-charade",
        price: 1200,
        currency: "NGN",
        description: "A fun crypto-themed charades game",
        image: "/api/placeholder/300/200",
        category: "card"
      },
      {
        id: 2,
        title: "Blockchain Trivia",
        slug: "blockchain-trivia",
        price: 1500,
        currency: "NGN", 
        description: "Test your blockchain knowledge",
        image: "/api/placeholder/300/200",
        category: "online"
      }
    ];
    
    return res.status(200).json(games);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}