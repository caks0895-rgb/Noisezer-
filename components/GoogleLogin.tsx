'use client';

import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function GoogleLogin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 truncate max-w-[150px]">
          {user.displayName || user.email}
        </span>
        <button 
          onClick={() => logout()}
          className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={async () => {
        try {
          await signInWithGoogle();
        } catch (error: any) {
          if (error.code === 'auth/cancelled-popup-request') {
            console.log('Login popup was closed by the user.');
          } else {
            console.error('Login error:', error);
          }
        }
      }}
      className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm"
    >
      Login with Google
    </button>
  );
}
