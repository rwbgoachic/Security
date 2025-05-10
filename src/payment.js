import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe("api_2wuAslzZsNIUBGGlxNQzrqKnS1B");

export async function initializePayment() {
  const stripe = await stripePromise;
  const elements = stripe.elements();

  const style = {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  };

  const card = elements.create('card', { style });
  card.mount('#payment-form');
}