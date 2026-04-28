import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Mic2, Armchair, ShoppingBag, FileBarChart, Settings,
  Bell, Plus, Ticket as TicketIcon, Wallet, Lock, LogOut, Clock, ArrowRight,
  X, Trash2, Sparkles,
} from "lucide-react";
import { getAdmin, adminLogout } from "@/lib/auth";
import { EVENTS, formatIDR, getCustomEvents, addCustomEvent, deleteCustomEvent, type EventItem } from "@/lib/mockData";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getAdmin()) {
      throw redirect({ to: "/admin/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard Admin — TicketWave" },
      { name: "description", content: "Panel admin TicketWave: kelola event, kursi, pesanan, dan laporan." },
    ],
  }),
  component: AdminDashboard,
});

type NavKey = "dashboard" | "events" | "seats" | "orders" | "reports" | "settings";

const GRADIENTS = [
  "linear-gradient(135deg,#0ea5e9,#a855f7,#ec4899)",
  "linear-gradient(135deg,#1e40af,#7dd3fc,#f0abfc)",
  "linear-gradient(135deg,#f97316,#eab308,#fb7185)",
  "linear-gradient(135deg,#0f172a,#dc2626,#fbbf24)",
  "linear-gradient(135deg,#10b981,#06b6d4,#8b5cf6)",
  "linear-gradient(135deg,#7c3aed,#ec4899,#f59e0b)",
  "linear-gradient(135deg,#14b8a6,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#ef4444,#f59e0b,#eab308)",
];

function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getAdmin();
  const [active, setActive] = useState<NavKey>("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [customEvents, setCustomEvents] = useState<EventItem[]>(() => getCustomEvents());

  const handleLogout = () => {
    adminLogout();
    navigate({ to: "/admin/login" });
  };

  const handleCreated = (ev: EventItem) => {
    addCustomEvent(ev);
    setCustomEvents(getCustomEvents());
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus event ini?")) return;
    deleteCustomEvent(id);
    setCustomEvents(getCustomEvents());
  };

  const now = useMemo(() => {
    const d = new Date();
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${days[d.getDay()]}, ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}.${pad(d.getMinutes())}`;
  }, []);

  const allEvents = [...customEvents, ...EVENTS];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">
        <div className="px-6 py-6">
          <div className="font-display text-xl font-extrabold tracking-tight">
            TICKET<span className="text-primary text-glow">WAVE</span>
          </div>
          <div className="mt-1 text-[11px] font-bold tracking-[0.25em] text-muted-foreground">ADMIN PANEL</div>
        </div>

        <nav className="flex-1 space-y-6 px-3">
          <NavSection title="OVERVIEW">
            <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active={active === "dashboard"} onClick={() => setActive("dashboard")} />
          </NavSection>
          <NavSection title="MANAJEMEN">
            <NavItem icon={<Mic2 className="h-4 w-4" />} label="Kelola Event" badge={customEvents.length || undefined} active={active === "events"} onClick={() => setActive("events")} />
            <NavItem icon={<Armchair className="h-4 w-4" />} label="Status Kursi" active={active === "seats"} onClick={() => setActive("seats")} />
            <NavItem icon={<ShoppingBag className="h-4 w-4" />} label="Pesanan" badge={3} active={active === "orders"} onClick={() => setActive("orders")} />
          </NavSection>
          <NavSection title="LAPORAN">
            <NavItem icon={<FileBarChart className="h-4 w-4" />} label="Laporan Penjualan" active={active === "reports"} onClick={() => setActive("reports")} />
          </NavSection>
          <NavSection title="SISTEM">
            <NavItem icon={<Settings className="h-4 w-4" />} label="Pengaturan" active={active === "settings"} onClick={() => setActive("settings")} />
          </NavSection>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {admin?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{admin?.name}</p>
              <p className="text-[10px] font-bold tracking-widest text-primary">{admin?.role}</p>
            </div>
            <button onClick={() => setConfirmLogout(true)} title="Logout" className="rounded-md p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              DASHBOARD <span className="text-primary">ADMIN</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground sm:flex">
                <Clock className="h-4 w-4 text-primary" /> {now}
              </div>
              <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              </button>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform">
                <Plus className="h-4 w-4" /> Tambah Event
              </button>
              <button onClick={() => setConfirmLogout(true)} className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/20">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="TOTAL TIKET TERJUAL" value="12K+" trend="+18% vs bulan lalu" trendColor="text-[color:var(--success)]" accent="var(--primary)" icon={<TicketIcon className="h-6 w-6" />} />
            <StatCard title="PENDAPATAN" value={<><span className="text-primary">Rp</span>48M</>} trend="+24% vs bulan lalu" trendColor="text-[color:var(--success)]" accent="var(--success)" icon={<Wallet className="h-6 w-6" />} />
            <StatCard title="EVENT AKTIF" value={String(48 + customEvents.length)} trend={customEvents.length > 0 ? `+${customEvents.length} event baru kamu tambahkan` : "+4 event baru pekan ini"} trendColor="text-[color:var(--success)]" accent="#60a5fa" icon={<Mic2 className="h-6 w-6" />} />
            <StatCard title="KURSI LOCKED AKTIF" value="127" trend="Real-time — pembaruan otomatis" trendColor="text-destructive" accent="var(--destructive)" icon={<Lock className="h-6 w-6" />} />
          </div>

          {/* Middle row */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="AKTIVITAS TERBARU" icon={<Clock className="h-4 w-4 text-primary" />} action={<button className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">Lihat Semua</button>}>
              <ul className="space-y-4">
                {customEvents[0] && (
                  <Activity dot="var(--success)" time="baru saja" text={<>Event baru <b className="text-primary">{customEvents[0].title}</b> ditambahkan oleh {admin?.name}</>} />
                )}
                <Activity dot="var(--success)" time="5 mnt" text={<>Tiket <b className="text-primary">Neon Dynasty</b> B-07 berhasil terjual ke Starlie.</>} />
                <Activity dot="var(--warning)" time="8 mnt" text={<>User <b className="text-primary">user_3341</b> mengunci kursi <b className="text-primary">C-09</b> Frozen Horizon</>} />
                <Activity dot="var(--destructive)" time="45 mnt" text={<>Transaksi <b className="text-primary">TW-00417</b> gagal — timeout pembayaran</>} />
                <Activity dot="#60a5fa" time="1 j" text={<>Event baru <b className="text-primary">Solar Bloom</b> ditambahkan oleh admin</>} />
                <Activity dot="oklch(0.65 0.02 85)" time="2 j" text={<>Lock kursi <b className="text-primary">A-03</b> kedaluwarsa, dikembalikan</>} />
              </ul>
            </Panel>

            <Panel title="STATUS KURSI GLOBAL" icon={<Armchair className="h-4 w-4 text-primary" />} action={<button className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">Detail</button>}>
              <div className="flex items-center gap-8">
                <DonutChart percent={76} />
                <div className="flex-1 space-y-3 text-sm">
                  <LegendRow color="var(--destructive)" label="Terjual" value="9,240" />
                  <LegendRow color="var(--warning)" label="Locked" value="127" />
                  <LegendRow color="var(--success)" label="Tersedia" value="2,833" />
                </div>
              </div>
              <div className="mt-6">
                <p className="text-xs font-bold tracking-widest text-muted-foreground">PENJUALAN 7 HARI</p>
                <MiniBars data={[40, 65, 48, 80, 55, 72, 90]} />
              </div>
            </Panel>
          </div>

          {/* Events Table */}
          <div className="mt-8 flex items-end justify-between">
            <h2 className="font-display text-xl font-extrabold">
              KELOLA <span className="text-primary">EVENT</span>
            </h2>
            <Link to="/" className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
              Lihat di Explore <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Event</th>
                  <th className="px-5 py-3 text-left">Tanggal</th>
                  <th className="px-5 py-3 text-left">Venue</th>
                  <th className="px-5 py-3 text-right">Harga Mulai</th>
                  <th className="px-5 py-3 text-right">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((ev) => {
                  const isCustom = customEvents.some((c) => c.id === ev.id);
                  return (
                    <tr key={ev.id} className="border-t border-border/60 hover:bg-accent/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 rounded-md" style={{ background: ev.poster }} />
                          <div>
                            <div className="font-semibold">{ev.title}</div>
                            <div className="text-xs text-muted-foreground">{ev.artist} · {ev.genre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{ev.date}</td>
                      <td className="px-5 py-3 text-muted-foreground">{ev.venue}</td>
                      <td className="px-5 py-3 text-right font-semibold text-primary">{formatIDR(ev.priceFrom)}</td>
                      <td className="px-5 py-3 text-right">
                        {isCustom ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-[color:var(--success)]"><Sparkles className="h-3 w-3" /> BARU</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tracking-widest text-muted-foreground">AKTIF</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link to="/event/$eventId" params={{ eventId: ev.id }} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">Lihat</Link>
                          {isCustom && (
                            <button onClick={() => handleDelete(ev.id)} className="rounded-md border border-destructive/40 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20" title="Hapus event">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">© 2026 TicketWave Admin Panel</p>
        </div>
      </main>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {confirmLogout && (
        <LogoutConfirm onCancel={() => setConfirmLogout(false)} onConfirm={handleLogout} />
      )}
    </div>
  );
}

// ============== ADD EVENT MODAL ==============
function AddEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ev: EventItem) => void }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [priceFrom, setPriceFrom] = useState<number | "">("");
  const [rating, setRating] = useState(8.5);
  const [poster, setPoster] = useState(GRADIENTS[0]);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !genre || !date || !venue || !priceFrom) {
      return setError("Semua field wajib diisi.");
    }
    if (Number(priceFrom) < 1000) return setError("Harga minimal Rp 1.000.");

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const ev: EventItem = {
      id,
      title: title.trim(),
      artist: artist.trim(),
      genre: genre.trim(),
      date: date.trim(),
      venue: venue.trim(),
      priceFrom: Number(priceFrom),
      rating: Math.max(0, Math.min(10, rating)),
      poster,
      accent: "#fbbf24",
    };
    onCreated(ev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-display text-xl font-extrabold">TAMBAH EVENT BARU</h3>
            <p className="text-xs text-muted-foreground">Isi detail event yang akan tayang di platform.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {/* Preview */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="relative aspect-[16/7]" style={{ background: poster }}>
              <div className="absolute inset-0 bg-grid opacity-30 mix-blend-overlay" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{genre || "GENRE"}</p>
                <h4 className="font-display text-2xl font-extrabold text-white">{title || "Judul Event"}</h4>
                <p className="text-sm text-white/80">{artist || "Nama Artis"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="JUDUL EVENT" value={title} onChange={setTitle} placeholder="Neon Dynasty" />
            <Input label="ARTIS" value={artist} onChange={setArtist} placeholder="Kage Riku" />
            <Input label="GENRE" value={genre} onChange={setGenre} placeholder="Cyberpunk / EDM / Pop" />
            <Input label="TANGGAL" value={date} onChange={setDate} placeholder="12 Jun 2026" />
            <Input label="VENUE" value={venue} onChange={setVenue} placeholder="GBK Senayan, Jakarta" className="sm:col-span-2" />
            <Input label="HARGA MULAI (Rp)" value={priceFrom === "" ? "" : String(priceFrom)} onChange={(v) => setPriceFrom(v === "" ? "" : Number(v.replace(/\D/g, "")))} placeholder="500000" />
            <div>
              <label className="mb-2 block text-xs font-bold tracking-widest text-muted-foreground">RATING ({rating.toFixed(1)})</label>
              <input type="range" min={0} max={10} step={0.1} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full accent-[color:var(--primary)]" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-muted-foreground">POSTER</label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {GRADIENTS.map((g) => (
                <button key={g} type="button" onClick={() => setPoster(g)} className={`aspect-square rounded-lg ring-2 transition-all ${poster === g ? "ring-primary scale-105" : "ring-transparent hover:ring-border"}`} style={{ background: g }} />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent">Batal</button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform">
              <Plus className="h-4 w-4" /> Simpan Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold tracking-widest text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-border bg-input/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}

// ============== LOGOUT CONFIRM ==============
function LogoutConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-destructive/40 bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
          <LogOut className="h-5 w-5 text-destructive" />
        </div>
        <h3 className="font-display text-xl font-extrabold">Keluar dari Admin Panel?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Session admin akan diakhiri dan cookie JWT dihapus.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent">Batal</button>
          <button onClick={onConfirm} className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:opacity-90">
            <LogOut className="h-4 w-4" /> Ya, Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== SUB COMPONENTS ==============
function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.25em] text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/15 text-primary font-semibold ring-1 ring-primary/30" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
      <span className={active ? "text-primary" : ""}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{badge}</span>
      )}
    </button>
  );
}

function StatCard({ title, value, trend, trendColor, accent, icon }: { title: string; value: React.ReactNode; trend: string; trendColor: string; accent: string; icon: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground">{title}</p>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <div className="mt-3 font-display text-4xl font-extrabold tracking-tight">{value}</div>
      <p className={`mt-3 text-xs ${trendColor}`}>↑ {trend}</p>
    </div>
  );
}

function Panel({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-display text-sm font-extrabold tracking-widest">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Activity({ dot, time, text }: { dot: string; time: string; text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />
      <p className="flex-1 text-sm">{text}</p>
      <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
    </li>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function DonutChart({ percent }: { percent: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const sold = (9240 / (9240 + 127 + 2833)) * c;
  const locked = (127 / (9240 + 127 + 2833)) * c;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--success)" strokeWidth="12" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--destructive)" strokeWidth="12" strokeDasharray={`${sold} ${c}`} />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--warning)" strokeWidth="12" strokeDasharray={`${locked} ${c}`} strokeDashoffset={-sold} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-2xl font-extrabold">{percent}%</div>
        <div className="text-[10px] font-bold tracking-widest text-muted-foreground">Terisi</div>
      </div>
    </div>
  );
}

function MiniBars({ data }: { data: number[] }) {
  const labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const max = Math.max(...data);
  return (
    <div className="mt-3">
      <div className="flex h-20 items-end gap-2">
        {data.map((v, i) => (
          <div key={i} className="flex-1 rounded-t bg-primary/70 transition-all hover:bg-primary" style={{ height: `${(v / max) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {labels.map((l) => <div key={l} className="flex-1 text-center text-[10px] text-muted-foreground">{l}</div>)}
      </div>
    </div>
  );
}
