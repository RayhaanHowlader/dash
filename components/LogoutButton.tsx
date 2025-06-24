'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Clear cookies on client side
      document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login page even if API call fails
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn-primary"
      style={{
        background: 'linear-gradient(135deg, #fc424a, #ff5252)',
        marginLeft: 'auto',
        marginRight: '1rem'
      }}
    >
      {loading ? (
        <>
          <span className="loading-spinner"></span>
          Logging out...
        </>
      ) : (
        'Logout'
      )}
    </button>
  );
};

export default LogoutButton; 