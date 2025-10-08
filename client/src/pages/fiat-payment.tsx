import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, CartItem } from '@/lib/types';

const AFRICAN_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬' },
];

export default function FiatPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cart = useCartStore((state) => state.items);
  const totalPrice = cart.reduce((acc: number, item: CartItem) => acc + item.game.price * item.quantity, 0);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // Get order data from navigation state or localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('checkoutOrder');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
    }
  }, []);

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No order data found</p>
          <Button onClick={() => setLocation('/checkout')}>Back to Checkout</Button>
        </div>
      </div>
    );
  }

  const { customerInfo } = orderData;

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/flutterwave/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderData.total,
          currency: 'NGN',
          customer_email: customerInfo.email,
          customer_name: customerInfo.fullName,
          customer_phone: customerInfo.phone,
          title: 'Rubikcon Games Order',
          description: `Order for ${orderData.items.length} game(s)`,
          redirect_url: `${window.location.origin}/payment-success`,
        }),
      });

      const data = await response.json();

      if (data.success && data.payment_link) {
        // Store order for success page
        localStorage.setItem('pendingOrder', JSON.stringify(orderData));
        // Redirect to Flutterwave payment page
        window.location.href = data.payment_link;
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Button 
        variant="ghost" 
        onClick={() => setLocation('/checkout')} 
        className="mb-6 -ml-2 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Checkout
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-500" />
            Pay with Card
          </CardTitle>
          <p className="text-muted-foreground">
            Secure payment powered by Flutterwave • Supports cards, mobile money, and bank transfers
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              {orderData.items.map((item: any) => (
                <div key={item.gameId} className="flex justify-between">
                  <span>{item.title} × {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
                <span>Total</span>
                <span>{formatPrice(orderData.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {customerInfo.fullName}</p>
              <p><strong>Email:</strong> {customerInfo.email}</p>
              <p><strong>Phone:</strong> {customerInfo.phone}</p>
              <p><strong>Address:</strong> {customerInfo.address}, {customerInfo.state}, {customerInfo.country}</p>
            </div>
          </div>



          {/* Payment Methods Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <h4 className="font-medium mb-2">Available Payment Methods</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Credit/Debit Cards (Visa, Mastercard, Verve)</p>
              <p>• Mobile Money (M-Pesa, MTN, Airtel Money)</p>
              <p>• Bank Transfer & USSD</p>
              <p>• Digital Wallets</p>
            </div>
          </div>

          <Button 
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {formatPrice(orderData.total)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your payment is secured by 256-bit SSL encryption
          </p>
        </CardContent>
      </Card>
    </div>
  );
}