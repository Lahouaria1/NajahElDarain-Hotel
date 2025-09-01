// src/components/NavBar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function NavBar() {
  // Auth state: current user (null if logged out) and a logout action
  const { user, logout } = useAuth();

  // Pathname is used to highlight the active navigation item
  const { pathname } = useLocation();

  // Mobile menu open/closed state
  const [open, setOpen] = useState(false);

  // Returns true if a nav item should appear active on the current route
  const isActive = (to: string) =>
    pathname === to || (to !== '/' && pathname.startsWith(to));

  /**
   * Reusable navigation link with:
   * - active styling via CSS utility classes (defined in index.css)
   * - aria-current for better accessibility
   * - closes the mobile menu on click
   */
  const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`nav-link ${active ? 'nav-link-active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen(false)}
      >
        {children}
      </Link>
    );
  };

  return (
    // Sticky, colorful header shown on every page
    <header className="sticky top-0 z-40 shadow-lg bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
      <div className="container-p h-16 flex items-center justify-between">
        {/* Brand / logo (click navigates to home) */}
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/20"
            aria-hidden="true"
          >
            N
          </span>
          NajahElDarain
        </Link>

        {/* Primary navigation (hidden on mobile, visible ≥ md) */}
        <nav className="hidden md:flex items-center gap-2 text-sm" aria-label="Huvudmeny">
          {/* Public links */}
          <NavItem to="/rooms">Rum</NavItem>
          <NavItem to="/about">Om oss</NavItem>

          {/* Authenticated user link */}
          {user && <NavItem to="/bookings">Mina bokningar</NavItem>}

          {/* Admin-only links (rendered only if user.role === 'Admin') */}
          {user?.role === 'Admin' && (
            <>
              <span className="opacity-50" aria-hidden="true">|</span>
              <NavItem to="/admin/rooms">Admin: Rum</NavItem>
              <NavItem to="/admin/bookings">Admin: Bokningar</NavItem>
              <NavItem to="/admin/users">Admin: Användare</NavItem>
            </>
          )}

          {/* Right-side auth actions: Login/Register when logged out; greeting + Logout when logged in */}
          {!user ? (
            <>
              <NavItem to="/login">Logga in</NavItem>
              {/* btn-outline-light is a custom utility class in index.css */}
              <Link to="/register" className="btn-outline-light" onClick={() => setOpen(false)}>
                Registrera
              </Link>
            </>
          ) : (
            <>
              <span className="hidden lg:inline text-white/90">
                Hej, <span className="font-semibold text-white">{user.username}</span>
              </span>
              {/* chip-role is a small pill for showing the role */}
              <span className="chip-role">{user.role}</span>
              {/* btn-ghost-light is a subtle button style on dark backgrounds */}
              <button className="btn-ghost-light" onClick={logout}>Logga ut</button>
            </>
          )}
        </nav>

        {/* Mobile menu toggle (hamburger button) */}
        <button
          className="md:hidden rounded-xl px-3 py-2 hover:bg-white/10"
          onClick={() => setOpen(s => !s)}
          aria-label="Öppna meny"
          aria-expanded={open}
          aria-controls="mobile-nav"
          type="button"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu (shown only when open) */}
      {open && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-white/20 bg-white/10 backdrop-blur"
        >
          <div className="container-p py-3 flex flex-col gap-1 text-sm">
            {/* Public + user links */}
            <NavItem to="/rooms">Rum</NavItem>
            <NavItem to="/about">Om oss</NavItem>
            {user && <NavItem to="/bookings">Mina bokningar</NavItem>}

            {/* Admin-only links */}
            {user?.role === 'Admin' && (
              <>
                <NavItem to="/admin/rooms">Admin: Rum</NavItem>
                <NavItem to="/admin/bookings">Admin: Bokningar</NavItem>
                <NavItem to="/admin/users">Admin: Användare</NavItem>
              </>
            )}

            {/* Auth section */}
            {!user ? (
              <>
                <NavItem to="/login">Logga in</NavItem>
                <Link to="/register" className="btn-outline-light" onClick={() => setOpen(false)}>
                  Registrera
                </Link>
              </>
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <span>
                  Hej, <span className="font-semibold text-white">{user.username}</span>{' '}
                  <span className="chip-role">{user.role}</span>
                </span>
                <button className="btn-ghost-light" onClick={logout}>Logga ut</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
