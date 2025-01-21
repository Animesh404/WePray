// In your api/subscribe.js
const MAILCHIMP_API_KEY = import.meta.env.VITE_MAILCHIMP_API_KEY || window.VITE_MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = import.meta.env.VITE_MAILCHIMP_LIST_ID || window.VITE_MAILCHIMP_LIST_ID;

export const subscribeToMailchimp = async (email, wantEncouragement, wantUpdates) => {
  if (!email || !email.length) {
    throw new Error('Email is required');
  }

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
    throw new Error('Mailchimp configuration is missing');
  }

  const DATACENTER = MAILCHIMP_API_KEY.split('-')[1];

  const data = {
    email_address: email,
    status: 'subscribed',
    merge_fields: {},
    tags: [
      ...(wantEncouragement ? ['encouragement'] : []),
      ...(wantUpdates ? ['updates'] : [])
    ]
  };

  try {
    const response = await fetch(
      `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to subscribe');
    }

    return { error: null, message: 'Successfully subscribed to the mailing list' };
  } catch (error) {
    console.error('Mailchimp API Error:', error);
    throw new Error('Failed to subscribe to the mailing list. Please try again later.');
  }
};