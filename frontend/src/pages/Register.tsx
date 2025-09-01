import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [username, setU] = useState('alice');
  const [password, setP] = useState('pass1234');
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try { await register(username, password); nav('/'); }
    catch (e: any) { setErr(e.message || 'Register failed'); }
  };

  return (
    <div className="container-p py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Registrera</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {err && <div className="text-red-600">{err}</div>}
        <input className="w-full border p-2 rounded-xl" value={username} onChange={e=>setU(e.target.value)} placeholder="Användarnamn" />
        <input className="w-full border p-2 rounded-xl" type="password" value={password} onChange={e=>setP(e.target.value)} placeholder="Lösenord" />
        <button className="btn-primary w-full">Skapa konto</button>
      </form>
      <p className="text-sm mt-3">Har du redan konto? <Link className="underline" to="/login">Logga in</Link></p>
    </div>
  );
}
