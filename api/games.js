export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
        description: "How well do you REALLY know crypto lingo? Act out Bitcoin, DeFi...",
        image: "/api/placeholder/300/200",
        category: "card"
      },
      {
        id: 2,
        title: "Blocks and Hashes",
        slug: "blocks-and-hashes",
        price: 1200,
        currency: "NGN",
        description: "Master the fundamentals of blockchain technology with this...",
        image: "/api/placeholder/300/200",
        category: "card"
      },
      {
        id: 3,
        title: "Into the Cryptoverse",
        slug: "into-the-cryptoverse",
        price: 1200,
        currency: "NGN",
        description: "Journey through the multiverse of cryptocurrency in this never-skip ca...",
        image: "/api/placeholder/300/200",
        category: "card"
      },
      {
        id: 4,
        title: "Web3 Trivia Online",
        slug: "web3-trivia-online",
        price: 0,
        currency: "NGN",
        description: "Play the ultimate Web3 trivia game online with friends from around the...",
        image: "/api/placeholder/300/200",
        category: "online"
      }
    ];
    
    return res.status(200).json(games);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}