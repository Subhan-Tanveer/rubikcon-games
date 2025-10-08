import axios from 'axios';

const testFlutterwave = async () => {
  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: 'test_' + Date.now(),
        amount: 100,
        currency: 'NGN',
        redirect_url: 'http://localhost:3000',
        customer: {
          email: 'test@example.com',
          name: 'Test User'
        },
        customizations: {
          title: 'Test Payment',
          description: 'Testing Flutterwave'
        }
      },
      {
        headers: {
          'Authorization': 'Bearer FLWSECK_TEST-161ad80c6c5b69f2701fd97378f50db4-X',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Flutterwave API works!');
    console.log('Payment link:', response.data.data.link);
  } catch (error) {
    console.log('❌ Flutterwave API error:');
    console.log(error.response?.data || error.message);
  }
};

testFlutterwave();