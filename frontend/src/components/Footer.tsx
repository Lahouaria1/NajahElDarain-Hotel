// src/components/Footer.tsx
const AUTHOR = import.meta.env.VITE_AUTHOR_NAME;

export default function Footer() {
  return (
    <footer className="mt-10">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />

      <div className="bg-slate-950 text-slate-200">
        <div className="container-p py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10">N</span>
              <span className="text-lg font-extrabold tracking-tight">NajahElDarain</span>
            </div>
            <p className="mt-3 text-slate-400 text-sm">
              Bokningsplattform för coworking – arbetsplatser & konferensrum.
            </p>
          </div>

          <div>
            <h3 className="footer-title">Tjänster</h3>
            <ul className="space-y-2 text-sm">
              <li><a className="footer-link" href="/rooms">Rum</a></li>
              <li><a className="footer-link" href="/bookings">Mina bokningar</a></li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Admin</h3>
            <ul className="space-y-2 text-sm">
              <li><a className="footer-link" href="/admin/rooms">Rumhantering</a></li>
              <li><a className="footer-link" href="/admin/bookings">Alla bokningar</a></li>
              <li><a className="footer-link" href="/admin/users">Användare</a></li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Kontakt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a className="footer-link" href="mailto:info@najah-eldarain.example">
                  info@najah-eldarain.example
                </a>
              </li>
              <li><span className="text-slate-400">Mån–Fre 09–17</span></li>
              <li className="flex gap-3 pt-1">
                <a className="footer-link" href="#" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                  </svg>
                </a>
                <a className="footer-link" href="#" aria-label="Twitter/X">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 4h-2.4l-3.6 5.1L8.4 4H4l6.1 8.2L4 20h2.4l4.1-5.9 3.7 5.9H20l-6.4-8.9L20 4z"/>
                  </svg>
                </a>
                <a className="footer-link" href="#" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.94 7.5A1.94 1.94 0 1 1 5 5.56 1.94 1.94 0 0 1 6.94 7.5zM5.5 9h2.9v9.5H5.5zM10 9h2.8v1.3h.04c.39-.74 1.35-1.52 2.78-1.52 2.97 0 3.52 1.96 3.52 4.5v5.19h-2.9v-4.6c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.78 1.2-1.78 2.44v4.68H10z"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-p py-4 text-xs text-slate-400 flex items-center justify-between">
            <span>© {new Date().getFullYear()} NajahElDarain</span>
            <span>
              Created by <span className="font-semibold text-slate-200">{AUTHOR}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
