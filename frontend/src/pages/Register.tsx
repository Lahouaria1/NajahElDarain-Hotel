// src/pages/Register.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('pass1234');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(username, password);
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Register failed');
    }
  };

  return (
    <div className="container-p py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Registrera</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <div className="text-red-600">{error}</div>}

        <input
          className="w-full border p-2 rounded-xl"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Användarnamn"
        />
        <input
          className="w-full border p-2 rounded-xl"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lösenord"
        />
        <button className="btn-primary w-full">Skapa konto</button>
      </form>

      <p className="text-sm mt-3">
        Har du redan konto?{' '}
        <Link className="underline" to="/login">
          Logga in
        </Link>
      </p>
    </div>
  );
}
