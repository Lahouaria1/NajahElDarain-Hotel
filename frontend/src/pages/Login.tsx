import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setU] = useState('admin');        // prefill to demo
  const [password, setP] = useState('admin1234');    // prefill to demo
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try { await login(username, password); nav('/'); }
    catch (e: any) { setErr(e.message || 'Login failed'); }
  };

  return (
    <div className="container-p py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Logga in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {err && <div className="text-red-600">{err}</div>}
        <input className="w-full border p-2 rounded-xl" value={username} onChange={e=>setU(e.target.value)} placeholder="Användarnamn" />
        <input className="w-full border p-2 rounded-xl" type="password" value={password} onChange={e=>setP(e.target.value)} placeholder="Lösenord" />
        <button className="btn-primary w-full">Logga in</button>
      </form>
      <p className="text-sm mt-3">Har du inget konto? <Link className="underline" to="/register">Registrera</Link></p>
    </div>
  );
}
