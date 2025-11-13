// src/pages/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin'); 
  const [password, setPassword] = useState('admin1234'); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await login(username, password);
      navigate('/');
    } catch (error: any) {
      setErrorMessage(error.message || 'Inloggningen misslyckades');
    }
  };

  return (
    <div className="container-p py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Logga in</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMessage && <div className="text-red-600">{errorMessage}</div>}

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

        <button className="btn-primary w-full">Logga in</button>
      </form>

      <p className="text-sm mt-3">
        Har du inget konto?{' '}
        <Link className="underline" to="/register">
          Registrera
        </Link>
      </p>
    </div>
  );
}
