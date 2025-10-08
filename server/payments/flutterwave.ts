import axios from 'axios';

interface FlutterwavePaymentData {
  amount: number;
  currency: string;
  email: string;
  phone_number?: string;
  name: string;
  tx_ref: string;
  redirect_url: string;
  payment_options?: string;
  country?: string;
}

interface FlutterwaveResponse {
  status: string;
  message: string;
  data: {
    link: string;
    payment_id: string;
  };
}

class FlutterwaveService {
  private baseURL = 'https://api.flutterwave.com/v3';
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    if (!this.secretKey && process.env.NODE_ENV === 'production') {
      throw new Error('FLUTTERWAVE_SECRET_KEY is required in production');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async createPaymentLink(paymentData: FlutterwavePaymentData): Promise<FlutterwaveResponse> {
    try {
      const requestData = {
        tx_ref: paymentData.tx_ref,
        amount: paymentData.amount,
        currency: paymentData.currency,
        redirect_url: paymentData.redirect_url,
        payment_options: paymentData.payment_options || 'card,mobilemoney,banktransfer,ussd',
        customer: {
          email: paymentData.email,
          name: paymentData.name,
          phonenumber: paymentData.phone_number
        },
        customizations: {
          title: 'Rubikcon Games',
          description: 'Game Purchase',
          logo: 'https://rubikcongames.xyz/images/logo.png',
        },
      };
      
      console.log('Flutterwave request data:', requestData);
      
      const response = await axios.post(
        `${this.baseURL}/payments`,
        requestData,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Flutterwave payment creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create payment link');
    }
  }

  async verifyTransaction(transactionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transactions/${transactionId}/verify`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Transaction verification failed:', error.response?.data || error.message);
      throw new Error('Failed to verify transaction');
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<boolean> {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || '';
    
    if (signature !== secretHash) {
      console.error('Invalid webhook signature');
      return false;
    }

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      console.log('Payment successful:', payload.data);
      return true;
    }

    return false;
  }
}

// Lazy initialization to ensure environment variables are loaded
let _flutterwaveService: FlutterwaveService | null = null;

export const getFlutterwaveService = (): FlutterwaveService | null => {
  if (!process.env.FLUTTERWAVE_SECRET_KEY) {
    return null;
  }
  
  if (!_flutterwaveService) {
    _flutterwaveService = new FlutterwaveService();
  }
  
  return _flutterwaveService;
};

// For backward compatibility
export const flutterwaveService = getFlutterwaveService();