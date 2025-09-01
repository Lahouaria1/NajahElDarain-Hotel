import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container-p py-8">
      {/* HERO */}
      <section className="hero mb-8">
        <img
          src="/Najah-darain-Hotel.png"       // file you put in public/
          alt="Najah Darain Hotel"
          className="hero-img"
        />
        <div className="hero-grad" />
        <div className="hero-copy">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow">
            Najah Darain Hotel
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/90">
            Boka arbetsplatser och konferensrum i en unik miljö.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/rooms" className="btn-primary">Utforska rum</Link>

            {/* Demo of the red delete style; remove this button here if not needed on Home */}
          </div>
        </div>
      </section>

      {/* Optional welcome below the hero */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold">
          {user ? <>Välkommen, <span className="text-brand-700">{user.username}</span>!</> : 'Välkommen'}
        </h2>
        <p className="text-gray-600 mt-1">
          {user
            ? (user.role === 'Admin' ? 'Du är inloggad som administratör.' : 'Du är inloggad som användare.')
            : 'Logga in eller registrera för att börja boka.'}
        </p>
      </section>
    </div>
  );
}
