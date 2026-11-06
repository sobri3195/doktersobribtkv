import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { NavLink, Routes, Route, useLocation, Link } from "react-router-dom";
import {
  House,
  BookOpen,
  ClipboardCheck,
  ChartNoAxesColumn,
  UserRound,
  ChevronDown,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useStore } from "../stores/useStore";
import { type Program } from "../services/model";
const Home = lazy(() =>
  import("../pages/Home").then((m) => ({ default: m.Home })),
);
const Materials = lazy(() =>
  import("../pages/Materials").then((m) => ({ default: m.Materials })),
);
const Tryout = lazy(() =>
  import("../pages/Tryout").then((m) => ({ default: m.Tryout })),
);
const Statistics = lazy(() =>
  import("../pages/Statistics").then((m) => ({ default: m.Statistics })),
);
const Profile = lazy(() =>
  import("../pages/Profile").then((m) => ({ default: m.Profile })),
);
const Admin = lazy(() =>
  import("../pages/Admin").then((m) => ({ default: m.Admin })),
);
const Session = lazy(() =>
  import("../pages/Session").then((m) => ({ default: m.Session })),
);
const Cases = lazy(() =>
  import("../pages/Cases").then((m) => ({ default: m.Cases })),
);
const tabs = [
  ["/", "Beranda", House],
  ["/materi", "Materi", BookOpen],
  ["/tryout", "Tryout", ClipboardCheck],
  ["/statistik", "Statistik", ChartNoAxesColumn],
  ["/profil", "Profil", UserRound],
] as const;
export function App() {
  const { data: d, error, update, clearError } = useStore();
  const location = useLocation();
  const active =
    location.pathname === "/sesi" && !!d.attempt && !d.attempt.submitted;
  const [onboard, setOnboard] = useState(!d.profile.onboarded);
  const [name, setName] = useState("");
  const positions = useRef<Record<string, number>>({});
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    document.documentElement.dataset.theme = d.theme;
  }, [d.theme]);
  useEffect(() => {
    const path = location.pathname;
    window.scrollTo(0, positions.current[path] || 0);
    const save = () => {
      positions.current[path] = window.scrollY;
    };
    window.addEventListener("scroll", save);
    return () => window.removeEventListener("scroll", save);
  }, [location.pathname]);
  return (
    <div className={`app ${active ? "exam-active" : ""}`}>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span>
          <span>
            NEXAM<small>ACADEMY</small>
          </span>
        </Link>
        <span className="sidebar-label">RUANG BELAJAR</span>
        {!active && (
          <nav aria-label="Navigasi desktop">
            {tabs.map(([path, label, Icon]) => (
              <NavLink key={path} to={path} end={path === "/"}>
                <Icon size={21} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="sidebar-note">
          <span>✦</span>
          <p>
            Belajar hari ini.
            <br />
            Bertumbuh setiap hari.
          </p>
          <small>Disimpan di perangkat Anda</small>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <Link to="/" className="mobile-brand">
            NEXAM<span>ACADEMY</span>
          </Link>
          <div className="program-select">
            <span className={`program-dot ${d.program}`} />
            <label className="sr-only" htmlFor="program">
              Program belajar
            </label>
            <select
              id="program"
              disabled={active}
              value={d.program}
              onChange={(e) =>
                update((s) => ({ ...s, program: e.target.value as Program }))
              }
            >
              <option value="btkv">BTKV</option>
              <option value="lpdp">LPDP</option>
              <option value="simak">SIMAK UI Pascasarjana</option>
            </select>
            <ChevronDown size={14} />
          </div>
          <Link className="avatar" to="/profil" aria-label="Buka profil">
            {d.profile.avatar}
          </Link>
        </header>
        <main id="main-content">
          <a className="skip-link" href="#main-content">
            Ke konten utama
          </a>
          {error && (
            <div role="alert" className="notice">
              {error}
              <Link to="/profil"> Cadangkan data</Link>
              <button onClick={clearError}>Tutup</button>
            </div>
          )}
          {needRefresh && (
            <div role="status" className="notice">
              Pembaruan tersedia.{" "}
              {d.attempt && !d.attempt.submitted ? (
                "Selesaikan sesi sebelum memperbarui."
              ) : (
                <button onClick={() => updateServiceWorker(true)}>
                  Perbarui aplikasi
                </button>
              )}
            </div>
          )}
          {offlineReady && (
            <p className="offline-status">
              ✓ Sumber aplikasi siap diakses offline
            </p>
          )}
          <Suspense
            fallback={
              <div className="skeleton" role="status">
                Memuat ruang belajar…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/materi" element={<Materials key={d.program} />} />
              <Route path="/tryout" element={<Tryout key={d.program} />} />
              <Route path="/statistik" element={<Statistics />} />
              <Route path="/profil" element={<Profile />} />
              <Route path="/kelola" element={<Admin />} />
              <Route path="/sesi" element={<Session />} />
              <Route path="/kasus" element={<Cases />} />
              <Route
                path="*"
                element={
                  <>
                    <h1>Halaman tidak ditemukan</h1>
                    <Link to="/">Kembali ke Beranda</Link>
                  </>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
      {!active && (
        <nav className="bottom-nav" aria-label="Navigasi utama">
          {tabs.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
      {onboard && (
        <div className="modal-overlay">
          <section
            className="modal onboarding"
            role="dialog"
            aria-modal="true"
            aria-label="Selamat datang"
          >
            <span className="brand-mark">N</span>
            <span className="eyebrow">SELAMAT DATANG DI NEXAM</span>
            <h1>
              Ruang untuk
              <br />
              potensi Anda.
            </h1>
            <p>
              Belajar BTKV, LPDP, dan SIMAK UI. Progres disimpan di browser ini,
              tanpa akun atau backend.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update((s) => ({
                  ...s,
                  profile: { ...s.profile, name: name.trim(), onboarded: true },
                }));
                setOnboard(false);
              }}
            >
              <label>
                Nama panggilan
                <input
                  autoFocus
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bagaimana kami menyapa Anda?"
                />
              </label>
              <button className="button" disabled={!name.trim()}>
                Mulai perjalanan belajar →
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
