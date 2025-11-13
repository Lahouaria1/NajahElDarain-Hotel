// src/pages/AdminUsers.tsx
import { useEffect, useMemo, useState } from 'react';
import { api, type Booking } from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type UserRow = { _id: string; username: string; role: 'User' | 'Admin' };

export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Load users and bookings from API
  async function loadData() {
    setIsLoading(true);
    try {
      const [userList, bookingList] = await Promise.all([
        api.getUsers(),
        api.getBookings(),
      ]);
      setUsers(userList);
      setBookings(bookingList);
    } catch (error: any) {
      setMessage(error.message || 'Kunde inte hämta data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Create a map of userId → number of bookings
  const bookingCounts = useMemo(() => {
    const bookingMap = new Map<string, number>();
    for (const booking of bookings) {
      const userId =
        typeof booking.userId === 'string'
          ? booking.userId
          : booking.userId?._id;
      if (!userId) continue;
      bookingMap.set(userId, (bookingMap.get(userId) || 0) + 1);
    }
    return bookingMap;
  }, [bookings]);

  // Delete user with confirmation and validation
  const removeUser = async (targetUser: UserRow) => {
    if (targetUser.role === 'Admin') {
      setMessage('Du kan inte ta bort administratörskonton.');
      return;
    }

    if (
      currentUser &&
      (currentUser.id === targetUser._id ||
        currentUser.username === targetUser.username)
    ) {
      setMessage('Du kan inte ta bort ditt eget konto.');
      return;
    }

    const userId = targetUser._id;
    const username = targetUser.username;
    const userHasBookings = (bookingCounts.get(userId) || 0) > 0;

    if (userHasBookings) {
      if (!confirm(`${username} har bokningar. Ta bort ändå?`)) return;
    } else {
      if (!confirm(`Ta bort ${username}?`)) return;
    }

    try {
      await api.deleteUser(userId);
      setMessage('Användare borttagen');
      loadData();
    } catch (error: any) {
      setMessage(error.message || 'Kunde inte ta bort användare');
    }
  };

  if (isLoading) {
    return <div className="container-p py-10">Laddar…</div>;
  }

  return (
    <div className="container-p py-10">
      <h1 className="text-2xl font-bold mb-6">Admin · Användare</h1>
      {message && <div className="mb-4 text-sm">{message}</div>}

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
            {users.map((userRow) => {
              const userId = userRow._id;
              const bookingCount = bookingCounts.get(userId) || 0;
              const isAdmin = userRow.role === 'Admin';
              const isSelf =
                currentUser &&
                (currentUser.id === userId ||
                  currentUser.username === userRow.username);

              return (
                <tr key={userId} className="border-b">
                  <td className="py-2">{userRow.username}</td>
                  <td className="py-2">{userRow.role}</td>
                  <td className="py-2">
                    {bookingCount}{' '}
                    {bookingCount > 0 && (
                      <Link
                        className="underline"
                        to={`/admin/bookings?userId=${userId}`}
                      >
                        (visa)
                      </Link>
                    )}
                  </td>
                  <td className="py-2">
                    {isAdmin || isSelf ? (
                      <button
                        className="btn-danger opacity-50 cursor-not-allowed"
                        disabled
                        title={
                          isAdmin
                            ? 'Administratörer kan inte tas bort'
                            : 'Du kan inte ta bort ditt eget konto'
                        }
                      >
                        Ta bort
                      </button>
                    ) : (
                      <button
                        className="btn-danger"
                        onClick={() => removeUser(userRow)}
                      >
                        Ta bort
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td className="py-4" colSpan={4}>
                  Inga användare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
