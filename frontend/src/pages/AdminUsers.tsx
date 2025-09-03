// Admin list of users with booking counts. Blocks deleting Admins and yourself.

import { useEffect, useMemo, useState } from 'react';
import { api, type Booking } from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // read current user

type UserRow = { _id: string; username: string; role: 'User' | 'Admin' };

export default function AdminUsers() {
  const { user } = useAuth(); // currently logged-in user

  const [users, setUsers] = useState<UserRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [u, b] = await Promise.all([api.getUsers(), api.getBookings()]);
      setUsers(u);
      setBookings(b);
    } catch (e: any) {
      setMsg(e.message || 'Kunde inte hämta data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // userId -> number of bookings
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bookings) {
      const uid = typeof b.userId === 'string' ? b.userId : b.userId?._id;
      if (!uid) continue;
      m.set(uid, (m.get(uid) || 0) + 1);
    }
    return m;
  }, [bookings]);

  const removeUser = async (u: UserRow) => {
    if (u.role === 'Admin') {
      setMsg('Du kan inte ta bort administratörskonton.');
      return;
    }
    // Prevent removing yourself
    if (user && (user.id === u._id || user.username === u.username)) {
      setMsg('Du kan inte ta bort ditt eget konto.');
      return;
    }

    const id = u._id;
    const username = u.username;
    const hasBookings = (counts.get(id) || 0) > 0;

    if (hasBookings) {
      if (!confirm(`${username} har bokningar. Ta bort ändå?`)) return;
    } else {
      if (!confirm(`Ta bort ${username}?`)) return;
    }

    try {
      await api.deleteUser(id);
      setMsg('Användare borttagen');
      load();
    } catch (e: any) {
      setMsg(e.message || 'Kunde inte ta bort användare');
    }
  };

  if (loading) return <div className="container-p py-10">Laddar…</div>;

  return (
    <div className="container-p py-10">
      <h1 className="text-2xl font-bold mb-6">Admin · Användare</h1>
      {msg && <div className="mb-4 text-sm">{msg}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Användarnamn</th>
              <th className="py-2">Roll</th>
              <th className="py-2">Bokningar</th>
              <th className="py-2">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const id = u._id;
              const c = counts.get(id) || 0;
              const isAdmin = u.role === 'Admin';
              const isSelf = user && (user.id === id || user.username === u.username);

              return (
                <tr key={id} className="border-b">
                  <td className="py-2">{u.username}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2">
                    {c}{' '}
                    {c > 0 && (
                      <Link className="underline" to={`/admin/bookings?userId=${id}`}>
                        (visa)
                      </Link>
                    )}
                  </td>
                  <td className="py-2">
                    {(isAdmin || isSelf) ? (
                      <button
                        className="btn-danger opacity-50 cursor-not-allowed"
                        disabled
                        title={isAdmin ? 'Administratörer kan inte tas bort' : 'Du kan inte ta bort ditt eget konto'}
                      >
                        Ta bort
                      </button>
                    ) : (
                      <button className="btn-danger" onClick={() => removeUser(u)}>
                        Ta bort
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td className="py-4" colSpan={4}>Inga användare.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
