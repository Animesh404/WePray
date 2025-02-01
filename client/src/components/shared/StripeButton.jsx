import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_KEY);
import api from "../../utils/axios";
const SubscriptionButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      // Replace with your Stripe price ID
      const priceId = 'price_1QnQeXKyEAyguwDwhKaLxsPZ'; 

      const response = await api.post('/subscription/create-checkout', { priceId });
        // console.log(response);
      if (!response.status === 200) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } =  response.data;
      console.log(sessionId);
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full text-center'>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="bg-[#409F9C] text-white font-semibold py-3 w-full px-6 rounded-full mb-8"
      >
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>
      {/* {error && <p className="text-red-500 mt-2">{error}</p>} */}
    </div>
  );
};

export default SubscriptionButton;