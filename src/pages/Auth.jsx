import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleAuth} className="auth-form">
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}</button>
        <p onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </p>
      </form>
    </div>
  );
}
