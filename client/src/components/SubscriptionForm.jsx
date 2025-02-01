    import { useState } from 'react';
    import { useAuth } from '../contexts/AuthContext';
    const TestSubscriptionForm = () => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
  
    const handleTestSubscribe = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      try {
        await fetch('/api/subscription/test/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        alert('Test subscription created successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Test subscription error:', error);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="mt-4 p-4 border rounded-md">
        <h3 className="text-lg font-semibold mb-2">Test Subscription</h3>
        <form onSubmit={handleTestSubscribe}>
          <button 
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {loading ? 'Creating...' : 'Create Test Subscription'}
          </button>
        </form>
      </div>
    );
  };

  export default TestSubscriptionForm;