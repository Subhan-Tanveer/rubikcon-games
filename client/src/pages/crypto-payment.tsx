import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, CartItem } from '@/lib/types';
import { useAccount, useDisconnect, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useConnectModal } from '@rainbow-me/rainbowkit';

type CryptoCurrency = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  address: string;
  network: string;
};

const CRYPTOCURRENCIES: CryptoCurrency[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    address: '0xaffcf1e02282b662f425f43a7c320d226781ed7b', 
    network: 'Ethereum (ERC20)',
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: '🔺',
    address: '0x1aB1cB4d9eEdbF4327c7F6855aB45e7e2dAe5f56',
    network: 'Avalanche (C-Chain)',
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    icon: '₮',
    address: '0xaffcf1e02282b662f425f43a7c320d226781ed7b', 
    network: 'Ethereum (ERC20)',
  },
];

const CRYPTO_ID_TO_RATE_KEY: Record<string, string> = {
  ethereum: 'ethereum',
  avalanche: 'avalanche-2',
  usdt: 'tether',
};

const GAS_FEE_LEVELS = {
  low: { label: 'Low', multiplier: 0.7 },
  medium: { label: 'Medium', multiplier: 1.0 },
  high: { label: 'High', multiplier: 1.3 },
};

export default function CryptoPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cart = useCartStore((state) => state.items);
  const totalPrice = cart.reduce((acc: number, item: CartItem) => acc + item.game.price * item.quantity, 0);

  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, { usd: number }>>({ ethereum: { usd: 0 }, avalanche: { usd: 0 }, usdt: { usd: 0 } });
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [hash, setHash] = useState<string | null>(null);
  const [gasFeeLevel, setGasFeeLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedGasFees, setEstimatedGasFees] = useState<{ baseFee: bigint; maxPriorityFee: bigint } | null>(null);

  // RainbowKit and Wagmi hooks
  const { openConnectModal } = useConnectModal();
  const { address: walletAddress, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: sendTxData, isPending: isSending, sendTransaction } = useSendTransaction();

  // Fetch crypto prices
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,avalanche-2,tether&vs_currencies=usd');
        const data = await response.json();
        setExchangeRates(data);
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        toast({ title: 'Error', description: 'Could not fetch crypto prices.', variant: 'destructive' });
      } finally {
        setIsLoadingRates(false);
      }
    };
    fetchRates();
  }, [toast]);

  // Fetch dynamic gas fee estimates (placeholder for actual API call)
  useEffect(() => {
    const fetchGasFees = async () => {
      // In a real implementation, use viem or ethers.js to fetch gas estimates
      // e.g., const feeData = await getFeeData();
      // For now, use placeholder values (typical for Ethereum network)
      setEstimatedGasFees({
        baseFee: BigInt(15000000000), // 15 Gwei base fee placeholder
        maxPriorityFee: BigInt(2000000000), // 2 Gwei priority fee placeholder
      });
    };

    if (selectedCrypto) {
      fetchGasFees();
    }
  }, [selectedCrypto]);

  const getCryptoAmount = (cryptoId: string) => {
    const rateKey = CRYPTO_ID_TO_RATE_KEY[cryptoId];
    const rate = exchangeRates[rateKey]?.usd;
    if (!rate || rate === 0) return '...';
    if (cryptoId === 'usdt') {
      return (totalPrice / 100).toFixed(2); // USDT is pegged to USD, enforce 1:1 conversion, convert cents to dollars
    }
    return ((totalPrice / 100) / rate).toFixed(6); // Convert cents to dollars before calculating crypto amount
  };

  const handleConnectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handlePayNow = () => {
    if (!selectedCrypto || !walletAddress) return;
    const amount = getCryptoAmount(selectedCrypto.id);
    let maxFeePerGas = BigInt(20000000000); // Default 20 Gwei
    let maxPriorityFeePerGas = BigInt(2000000000); // Default 2 Gwei

    if (estimatedGasFees) {
      const multiplier = GAS_FEE_LEVELS[gasFeeLevel].multiplier;
      maxPriorityFeePerGas = BigInt(Math.floor(Number(estimatedGasFees.maxPriorityFee) * multiplier));
      maxFeePerGas = estimatedGasFees.baseFee + maxPriorityFeePerGas;
    }

    sendTransaction({
      to: selectedCrypto.address as `0x${string}`,
      value: parseEther(amount as `${number}`),
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  };

  const handleCopyAddress = () => {
    if (!selectedCrypto) return;
    navigator.clipboard.writeText(selectedCrypto.address);
    toast({ title: 'Copied!', description: 'Address copied to clipboard.' });
  };

  const handleBack = () => {
    setSelectedCrypto(null);
    setHash(null);
  };

  // Main view for selecting a cryptocurrency
  if (!selectedCrypto) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => setLocation('/checkout')} className="mb-6 -ml-2 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pay with Cryptocurrency</CardTitle>
            <CardDescription>Select your preferred cryptocurrency to complete the payment</CardDescription>
            {isConnected && walletAddress && (
              <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Connected</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CRYPTOCURRENCIES.map((crypto) => (
                <div
                  key={crypto.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCrypto(crypto)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{crypto.icon}</div>
                    <div>
                      <div className="font-medium">{crypto.name}</div>
                      <div className="text-sm text-muted-foreground">{crypto.network}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {isLoadingRates ? (
                        <Loader2 className="h-4 w-4 animate-spin inline-block" />
                      ) : (
                        `${getCryptoAmount(crypto.id)} ${crypto.symbol}`
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{formatPrice(totalPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View for handling the payment for the selected cryptocurrency
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Button variant="ghost" onClick={handleBack} className="mb-6 -ml-2 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to selection
      </Button>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">{selectedCrypto.icon}</div>
            <CardTitle className="text-2xl font-bold">Pay with {selectedCrypto.name}</CardTitle>
          </div>
          <CardDescription>
            {isSending
              ? 'Check your wallet to confirm the transaction.'
              : `Complete your payment by sending ${selectedCrypto.symbol} to the address below`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold tracking-tight">
                {getCryptoAmount(selectedCrypto.id)} {selectedCrypto.symbol}
              </p>
              <p className="text-muted-foreground">{formatPrice(totalPrice)}</p>
            </div>

            {isConnected ? (
              <div className="rounded-lg border bg-muted/20 p-3 text-center">
                <p className="text-sm font-medium text-foreground">Connected as</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {`${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
                </p>
              </div>
            ) : (
              <Button className="w-full" onClick={handleConnectWallet}>
                Connect Wallet
              </Button>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Send to this address</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto no-scrollbar">
                  {`${selectedCrypto.address.slice(0, 10)}...${selectedCrypto.address.slice(-8)}`}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Network: {selectedCrypto.network}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gas Fee Preference</label>
              <div className="flex gap-2">
                {Object.entries(GAS_FEE_LEVELS).map(([level, { label }]) => (
                  <Button
                    key={level}
                    variant={gasFeeLevel === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGasFeeLevel(level as 'low' | 'medium' | 'high')}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {estimatedGasFees ? (
                  `Estimated fee: ~${(Number(estimatedGasFees.baseFee + (estimatedGasFees.maxPriorityFee * BigInt(Math.floor(GAS_FEE_LEVELS[gasFeeLevel].multiplier * 100))) / BigInt(100)) / 1000000000).toFixed(2)} Gwei`
                ) : (
                  'Estimating gas fees...'
                )}
              </p>
            </div>

            {hash && (
              <div className="pt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing transaction...
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                >
                  View on Etherscan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {!hash && isConnected && (
              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayNow}
                  disabled={isSending || !isConnected}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Check your wallet...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Click to initiate the transaction in your wallet
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
