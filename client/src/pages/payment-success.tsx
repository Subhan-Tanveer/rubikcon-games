import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/types';

interface PaymentStatus {
  success: boolean;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  amount?: number;
  currency?: string;
  message: string;
}

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('tx_ref') || urlParams.get('reference');
    const status = urlParams.get('status');

    if (reference) {
      // Fetch payment status from backend
      fetchPaymentStatus(reference);
    } else {
      // No reference found, assume success for demo
      setPaymentStatus({
        success: true,
        status: 'completed',
        message: 'Payment completed successfully!',
      });
      setIsLoading(false);
    }
  }, []);

  const fetchPaymentStatus = async (reference: string) => {
    try {
      const response = await fetch(`/api/payment-status/${reference}`);
      const data = await response.json();
      
      setPaymentStatus({
        success: data.success,
        status: data.status,
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
        message: data.message,
      });
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
      setPaymentStatus({
        success: false,
        status: 'failed',
        message: 'Failed to verify payment status',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-16 w-16 animate-spin text-blue-500" />;
    }

    if (!paymentStatus) {
      return <XCircle className="h-16 w-16 text-red-500" />;
    }

    switch (paymentStatus.status) {
      case 'completed':
        return <CheckCircle2 className="h-16 w-16 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-16 w-16 animate-spin text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!paymentStatus) return 'text-red-600';
    
    switch (paymentStatus.status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-red-600';
    }
  };

  const getStatusTitle = () => {
    if (isLoading) return 'Verifying Payment...';
    if (!paymentStatus) return 'Payment Status Unknown';
    
    switch (paymentStatus.status) {
      case 'completed':
        return 'Payment Successful!';
      case 'pending':
        return 'Payment Pending';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Payment Status Unknown';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl font-bold ${getStatusColor()}`}>
            {getStatusTitle()}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          ) : paymentStatus ? (
            <>
              <p className="text-muted-foreground text-lg">
                {paymentStatus.message}
              </p>

              {paymentStatus.reference && (
                <div className="bg-muted/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Transaction Reference</p>
                  <p className="font-mono text-sm">{paymentStatus.reference}</p>
                </div>
              )}

              {paymentStatus.amount && paymentStatus.currency && (
                <div className="bg-muted/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-xl font-bold">
                    {paymentStatus.currency === 'USD' 
                      ? formatPrice(paymentStatus.amount * 100)
                      : `${paymentStatus.amount} ${paymentStatus.currency}`
                    }
                  </p>
                </div>
              )}

              {paymentStatus.status === 'completed' && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    What happens next?
                  </h3>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
                    <li>• You'll receive an order confirmation email shortly</li>
                    <li>• Your games will be processed and prepared for delivery</li>
                    <li>• Delivery takes 2 days within Lagos, 5-7 days outside Lagos</li>
                    <li>• International delivery may take 2+ weeks</li>
                  </ul>
                </div>
              )}

              {paymentStatus.status === 'pending' && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    Your payment is being processed. This may take a few minutes. 
                    You'll receive a confirmation email once the payment is complete.
                  </p>
                </div>
              )}

              {paymentStatus.status === 'failed' && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    Your payment could not be processed. Please try again or contact support if the issue persists.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              Unable to determine payment status. Please contact support if you need assistance.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
            >
              Continue Shopping
            </Button>
            
            {paymentStatus?.status === 'completed' && (
              <Button 
                onClick={() => setLocation('/orders')}
                className="flex items-center gap-2"
              >
                View Orders <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            
            {paymentStatus?.status === 'failed' && (
              <Button 
                onClick={() => setLocation('/checkout')}
                className="flex items-center gap-2"
              >
                Try Again <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}