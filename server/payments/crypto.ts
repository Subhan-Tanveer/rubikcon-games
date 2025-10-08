import axios from 'axios';

interface CryptoPaymentData {
  amount: number;
  currency: string;
  order_id: string;
  customer_email: string;
  redirect_url: string;
  webhook_url: string;
}

interface SwyptPaymentResponse {
  success: boolean;
  data: {
    payment_url: string;
    payment_id: string;
    qr_code?: string;
  };
}

class CryptoPaymentService {
  private coinbaseApiKey: string;
  private coinbaseBaseUrl = 'https://api.commerce.coinbase.com';

  constructor() {
    this.coinbaseApiKey = process.env.COINBASE_COMMERCE_API_KEY || '';
  }

  private getHeaders() {
    return {
      'X-CC-Api-Key': this.coinbaseApiKey,
      'X-CC-Version': '2018-03-22',
      'Content-Type': 'application/json',
    };
  }

  async createSwyptPayment(paymentData: CryptoPaymentData): Promise<SwyptPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.swyptBaseUrl}/payments`,
        {
          amount: paymentData.amount,
          currency: paymentData.currency,
          order_reference: paymentData.order_id,
          customer_email: paymentData.customer_email,
          success_url: paymentData.redirect_url,
          cancel_url: paymentData.redirect_url,
          webhook_url: paymentData.webhook_url,
          accepted_currencies: ['BTC', 'ETH', 'USDT', 'USDC', 'BNB'],
          metadata: {
            source: 'rubikcon-games',
            order_id: paymentData.order_id,
          },
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: {
          payment_url: response.data.payment_url,
          payment_id: response.data.payment_id,
          qr_code: response.data.qr_code,
        },
      };
    } catch (error: any) {
      console.error('Swypt payment creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create crypto payment');
    }
  }

  async verifyCryptoTransaction(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.swyptBaseUrl}/payments/${paymentId}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Crypto transaction verification failed:', error.response?.data || error.message);
      throw new Error('Failed to verify crypto transaction');
    }
  }

  async handleCryptoWebhook(payload: any, signature: string): Promise<boolean> {
    // Verify webhook signature
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || '';
    
    // In production, verify the signature properly
    if (!signature || !webhookSecret) {
      console.error('Invalid webhook signature or missing secret');
      return false;
    }

    // Process successful payment
    if (payload.event === 'payment.completed' && payload.data.status === 'confirmed') {
      console.log('Crypto payment successful:', payload.data);
      return true;
    }

    return false;
  }

  // Alternative: Coinbase Commerce integration
  async createCoinbasePayment(paymentData: CryptoPaymentData): Promise<any> {
    const coinbaseApiKey = process.env.COINBASE_COMMERCE_API_KEY;
    
    if (!coinbaseApiKey) {
      throw new Error('Coinbase Commerce API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.commerce.coinbase.com/charges',
        {
          name: 'Rubikcon Games Purchase',
          description: `Order #${paymentData.order_id}`,
          pricing_type: 'fixed_price',
          local_price: {
            amount: paymentData.amount.toString(),
            currency: paymentData.currency,
          },
          metadata: {
            order_id: paymentData.order_id,
            customer_email: paymentData.customer_email,
          },
          redirect_url: paymentData.redirect_url,
        },
        {
          headers: {
            'X-CC-Api-Key': coinbaseApiKey,
            'X-CC-Version': '2018-03-22',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Coinbase payment creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create Coinbase payment');
    }
  }
}

export const cryptoPaymentService = new CryptoPaymentService();