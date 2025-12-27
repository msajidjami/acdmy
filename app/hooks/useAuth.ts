// app/hooks/useAuth.ts
import { useState } from 'react';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string; // Optional
  code?: string; // Optional
}

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const signup = async (data: SignupData) => {
    setLoading(true);
    try {
      // صرف required fields بھیجیں
      const payload: any = {
        name: data.name,
        email: data.email,
        password: data.password
      };
      
      // صرف اگر code موجود ہے تو بھیجیں
      if (data.code) {
        payload.code = data.code;
      }
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };

  return { signup, user, loading };
};