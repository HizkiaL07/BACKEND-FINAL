import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mic2,
  Armchair,
  ShoppingBag,
  FileBarChart,
  Settings,
  Bell,
  Plus,
  Ticket as TicketIcon,
  Wallet,
  Lock,
  LogOut,
  Clock,
  ArrowRight,
  X,
  Trash2,
  Sparkles,
  Pencil,
  Camera,
  User,
  Mail,
} from "lucide-react";
import { getAdmin, adminLogout, updateAdmin } from "@/lib/auth";
import {
  EVENTS,
  formatIDR,
  getCustomEvents,
  addCustomEvent,
  deleteCustomEvent,
  updateCustomEvent,
  type EventItem,
} from "@/lib/mockData";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getAdmin()) {
      throw redirect({ to: "/admin/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard Admin — TicketWave" },
      {
        name: "description",
        content: "Panel admin TicketWave: kelola event, kursi, pesanan, dan laporan.",
      },
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
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [customEvents, setCustomEvents] = useState<EventItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [now, setNow] = useState("");

  const [adminName, setAdminName] = useState(admin?.name || "");
  const [adminUsername, setAdminUsername] = useState(admin?.username || "");

  const fetchEvents = async () => {
    try {
      const locals = getCustomEvents();
      const res = await fetch("http://localhost:8080/api/events");
      const json = await res.json();
      
      let backendEvents: EventItem[] = [];
      if (json.success) {
        backendEvents = json.data.map((e: any) => ({
          id: e.id.toString(),
          dbId: e.id,
          title: e.title,
          artist: e.description || "Artist",
          genre: "Concert",
          date: new Date(e.event_date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          venue: e.location,
          priceFrom: e.tickets?.[0]?.price || 100000,
          rating: 9.0,
          poster: e.image_url || GRADIENTS[0],
          accent: "#22d3ee",
        }));
      }
      const backendIds = new Set(backendEvents.map(e => e.dbId));
      const filteredLocals = locals.filter(e => !backendIds.has(e.dbId));
      setAllEvents([...filteredLocals, ...backendEvents]);
      setCustomEvents(filteredLocals);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setAllEvents(getCustomEvents());
    }
  };

  useEffect(() => {
    fetchEvents();
    const d = new Date();
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const pad = (n: number) => n.toString().padStart(2, "0");
    setNow(
      `${days[d.getDay()]}, ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}.${pad(d.getMinutes())}`,
    );
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate({ to: "/admin/login" });
  };

  const handleCreated = () => {
    fetchEvents();
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus event ini?")) return;
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tw_admin_jwt="))
      ?.split("=")[1];

    const isNumeric = /^\d+$/.test(id);
    if (!isNumeric || !token || token.startsWith("mock.")) {
      deleteCustomEvent(id);
      fetchEvents();
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/admin/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      fetchEvents();
    } catch (e: any) {
      alert(e.message || "Gagal menghapus event");
    }
  };

  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [showNotif, setShowNotif] = useState(false);

  const handleEditSaved = () => {
    fetchEvents();
    setEditEvent(null);
  };

  const handleChangePassword = () => {
    setNewPwd("");
    setShowPwdModal(true);
  };

  const handleConfirmChangePassword = async () => {
    if (newPwd.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }
    const res = await updateAdmin({ password: newPwd });
    if (res.success) {
      alert("Password berhasil diubah");
      setShowPwdModal(false);
    } else {
      alert(res.message);
    }
  };

  const handleSaveProfile = async () => {
    const res = await updateAdmin({ full_name: adminName, username: adminUsername });
    if (res.success) {
      alert("Profil berhasil diperbarui!");
      window.location.reload();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">
        <div className="px-6 py-6">
          <div className="font-display text-xl font-extrabold tracking-tight">
            TICKET<span className="text-primary text-glow">WAVE</span>
          </div>
          <div className="mt-1 text-[11px] font-bold tracking-[0.25em] text-muted-foreground">
            ADMIN PANEL
          </div>
        </div>

        <nav className="flex-1 space-y-6 px-3">
          <NavSection title="OVERVIEW">
            <NavItem
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              active={active === "dashboard"}
              onClick={() => setActive("dashboard")}
            />
          </NavSection>
          <NavSection title="MANAJEMEN">
            <NavItem
              icon={<Mic2 className="h-4 w-4" />}
              label="Kelola Event"
              badge={customEvents.length || undefined}
              active={active === "events"}
              onClick={() => setActive("events")}
            />
            <NavItem
              icon={<Armchair className="h-4 w-4" />}
              label="Status Kursi"
              active={active === "seats"}
              onClick={() => setActive("seats")}
            />
            <NavItem
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Pesanan"
              badge={3}
              active={active === "orders"}
              onClick={() => setActive("orders")}
            />
          </NavSection>
          <NavSection title="LAPORAN">
            <NavItem
              icon={<FileBarChart className="h-4 w-4" />}
              label="Laporan Penjualan"
              active={active === "reports"}
              onClick={() => setActive("reports")}
            />
          </NavSection>
          <NavSection title="SISTEM">
            <NavItem
              icon={<Settings className="h-4 w-4" />}
              label="Pengaturan"
              active={active === "settings"}
              onClick={() => setActive("settings")}
            />
          </NavSection>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {admin?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{admin?.name}</p>
              <p className="text-[10px] font-bold tracking-widest text-primary">{admin?.role}</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              title="Logout"
              className="rounded-md p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              DASHBOARD <span className="text-primary">ADMIN</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground sm:flex">
                <Clock className="h-4 w-4 text-primary" /> {now}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
                </button>
                {showNotif && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl z-50">
                    <h3 className="text-sm font-bold tracking-widest text-primary mb-3">
                      NOTIFIKASI
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="rounded-lg bg-accent/50 p-2">
                        <span className="text-[color:var(--success)] font-bold">INFO: </span>
                        Event Neon Dynasty hampir penuh (95%).
                      </div>
                      <div className="rounded-lg bg-accent/50 p-2">
                        <span className="text-[color:var(--warning)] font-bold">PERINGATAN: </span>3
                        pesanan gagal karena timeout.
                      </div>
                      <div className="rounded-lg bg-accent/50 p-2 text-muted-foreground text-center">
                        Tidak ada notifikasi lain.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
              >
                <Plus className="h-4 w-4" /> Tambah Event
              </button>
              <button
                onClick={() => setConfirmLogout(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/20"
              >
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {active === "dashboard" && (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="TOTAL TIKET TERJUAL"
                  value="12K+"
                  trend="+18% vs bulan lalu"
                  trendColor="text-[color:var(--success)]"
                  accent="var(--primary)"
                  icon={<TicketIcon className="h-6 w-6" />}
                />
                <StatCard
                  title="PENDAPATAN"
                  value={
                    <>
                      <span className="text-primary">Rp</span>48M
                    </>
                  }
                  trend="+24% vs bulan lalu"
                  trendColor="text-[color:var(--success)]"
                  accent="var(--success)"
                  icon={<Wallet className="h-6 w-6" />}
                />
                <StatCard
                  title="EVENT AKTIF"
                  value={String(48 + customEvents.length)}
                  trend={
                    customEvents.length > 0
                      ? `+${customEvents.length} event baru kamu tambahkan`
                      : "+4 event baru pekan ini"
                  }
                  trendColor="text-[color:var(--success)]"
                  accent="#60a5fa"
                  icon={<Mic2 className="h-6 w-6" />}
                />
                <StatCard
                  title="KURSI LOCKED AKTIF"
                  value="127"
                  trend="Real-time — pembaruan otomatis"
                  trendColor="text-destructive"
                  accent="var(--destructive)"
                  icon={<Lock className="h-6 w-6" />}
                />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Panel
                  title="AKTIVITAS TERBARU"
                  icon={<Clock className="h-4 w-4 text-primary" />}
                  action={
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
                      Lihat Semua
                    </button>
                  }
                >
                  <ul className="space-y-4">
                    {customEvents[0] && (
                      <Activity
                        dot="var(--success)"
                        time="baru saja"
                        text={
                          <>
                            Event baru <b className="text-primary">{customEvents[0].title}</b>{" "}
                            ditambahkan oleh {admin?.name}
                          </>
                        }
                      />
                    )}
                    <Activity
                      dot="var(--success)"
                      time="5 mnt"
                      text={
                        <>
                          Tiket <b className="text-primary">Neon Dynasty</b> B-07 berhasil terjual
                          ke Andi S.
                        </>
                      }
                    />
                    <Activity
                      dot="var(--warning)"
                      time="8 mnt"
                      text={
                        <>
                          User <b className="text-primary">user_3341</b> mengunci kursi{" "}
                          <b className="text-primary">C-09</b> Frozen Horizon
                        </>
                      }
                    />
                    <Activity
                      dot="var(--destructive)"
                      time="45 mnt"
                      text={
                        <>
                          Transaksi <b className="text-primary">TW-00417</b> gagal — timeout
                          pembayaran
                        </>
                      }
                    />
                    <Activity
                      dot="#60a5fa"
                      time="1 j"
                      text={
                        <>
                          Event baru <b className="text-primary">Solar Bloom</b> ditambahkan oleh
                          admin
                        </>
                      }
                    />
                    <Activity
                      dot="oklch(0.65 0.02 85)"
                      time="2 j"
                      text={
                        <>
                          Lock kursi <b className="text-primary">A-03</b> kedaluwarsa, dikembalikan
                        </>
                      }
                    />
                  </ul>
                </Panel>

                <Panel
                  title="STATUS KURSI GLOBAL"
                  icon={<Armchair className="h-4 w-4 text-primary" />}
                  action={
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
                      Detail
                    </button>
                  }
                >
                  <div className="flex items-center gap-8">
                    <DonutChart percent={76} />
                    <div className="flex-1 space-y-3 text-sm">
                      <LegendRow color="var(--destructive)" label="Terjual" value="9,240" />
                      <LegendRow color="var(--warning)" label="Locked" value="127" />
                      <LegendRow color="var(--success)" label="Tersedia" value="2,833" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-xs font-bold tracking-widest text-muted-foreground">
                      PENJUALAN 7 HARI
                    </p>
                    <MiniBars data={[40, 65, 48, 80, 55, 72, 90]} />
                  </div>
                </Panel>
              </div>
            </>
          )}

          {active === "events" && (
            <>
              <div className="mt-8 flex items-end justify-between">
                <h2 className="font-display text-xl font-extrabold">
                  KELOLA <span className="text-primary">EVENT</span>
                </h2>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent"
                >
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
                              <span
                                className="h-9 w-9 rounded-md"
                                style={getPosterStyle(ev.poster)}
                              />
                              <div>
                                <div className="font-semibold">{ev.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {ev.artist} · {ev.genre}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{ev.date}</td>
                          <td className="px-5 py-3 text-muted-foreground">{ev.venue}</td>
                          <td className="px-5 py-3 text-right font-semibold text-primary">
                            {formatIDR(ev.priceFrom)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {isCustom ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-[color:var(--success)]">
                                <Sparkles className="h-3 w-3" /> BARU
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tracking-widest text-muted-foreground">
                                AKTIF
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to="/event/$eventId"
                                params={{ eventId: ev.id }}
                                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                              >
                                Lihat
                              </Link>
                              <button
                                onClick={() => setEditEvent(ev)}
                                className="rounded-md border border-primary/40 bg-primary/10 p-1.5 text-primary hover:bg-primary/20"
                                title="Edit event"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(ev.id)}
                                className="rounded-md border border-destructive/40 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20"
                                title="Hapus event"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {active === "seats" && (
            <div className="mt-8">
              <div className="flex items-end justify-between mb-4">
                <h2 className="font-display text-xl font-extrabold">
                  STATUS <span className="text-primary">KURSI</span>
                </h2>
                <select className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none">
                  <option>Pilih Event...</option>
                  {allEvents.map((e) => (
                    <option key={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Armchair className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-bold">Peta Kursi Interaktif</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
                  Silakan pilih event dari dropdown di atas untuk mengelola ketersediaan kursi
                  secara visual, melihat kursi yang terkunci, atau membatalkan reservasi.
                </p>
                <div className="mt-8 flex gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[color:var(--success)]"></span>{" "}
                    Tersedia
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[color:var(--warning)]"></span> Locked
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[color:var(--destructive)]"></span>{" "}
                    Terjual
                  </span>
                </div>
              </div>
            </div>
          )}

          {active === "orders" && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-extrabold mb-4">
                MANAJEMEN <span className="text-primary">PESANAN</span>
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-left">ID Pesanan</th>
                      <th className="px-5 py-3 text-left">Pembeli</th>
                      <th className="px-5 py-3 text-left">Event</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: "TW-8812",
                        name: "Andi S.",
                        event: "Neon Dynasty",
                        total: 1500000,
                        status: "SUCCESS",
                      },
                      {
                        id: "TW-8811",
                        name: "Budi P.",
                        event: "Frozen Horizon",
                        total: 500000,
                        status: "PENDING",
                      },
                      {
                        id: "TW-8810",
                        name: "Citra K.",
                        event: "Neon Dynasty",
                        total: 750000,
                        status: "SUCCESS",
                      },
                      {
                        id: "TW-8809",
                        name: "Doni W.",
                        event: "Solar Bloom",
                        total: 450000,
                        status: "FAILED",
                      },
                    ].map((order) => (
                      <tr key={order.id} className="border-t border-border/60 hover:bg-accent/30">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-primary">
                          {order.id}
                        </td>
                        <td className="px-5 py-4 font-semibold">{order.name}</td>
                        <td className="px-5 py-4 text-muted-foreground">{order.event}</td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatIDR(order.total)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest ${
                              order.status === "SUCCESS"
                                ? "bg-success/15 text-[color:var(--success)]"
                                : order.status === "PENDING"
                                  ? "bg-warning/15 text-[color:var(--warning)]"
                                  : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === "reports" && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-extrabold mb-4">
                LAPORAN <span className="text-primary">PENJUALAN</span>
              </h2>
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground mb-2">
                    KONVERSI
                  </p>
                  <p className="font-display text-3xl font-extrabold text-primary">4.8%</p>
                  <p className="text-xs text-[color:var(--success)] mt-2">↑ +0.3% vs pekan lalu</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground mb-2">
                    TOTAL TRANSAKSI
                  </p>
                  <p className="font-display text-3xl font-extrabold text-primary">1,248</p>
                  <p className="text-xs text-[color:var(--success)] mt-2">↑ +12% vs pekan lalu</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground mb-2">
                    AVG. ORDER VALUE
                  </p>
                  <p className="font-display text-3xl font-extrabold text-primary">Rp 650K</p>
                  <p className="text-xs text-muted-foreground mt-2">- stabil</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[300px]">
                <FileBarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-bold">Laporan Detail Belum Tersedia</p>
                <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
                  Integrasi modul analitik tingkat lanjut sedang dalam pengembangan untuk versi
                  mendatang.
                </p>
              </div>
            </div>
          )}

          {active === "settings" && (
            <div className="mt-8 max-w-2xl mx-auto">
              <h2 className="font-display text-xl font-extrabold mb-6">
                PROFIL & PENGATURAN <span className="text-primary">ADMIN</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card">
                   <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-1 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-background overflow-hidden relative">
                      {admin?.email && (
                        <span className="font-display text-3xl font-black text-primary">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold">{admin?.name}</h3>
                  <p className="text-sm text-muted-foreground">{admin?.email}</p>
                  <div className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {admin?.role}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="text-xs font-bold tracking-widest text-primary uppercase">Informasi Personal</h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <AdminProfileField
                      icon={<User className="h-4 w-4" />}
                      label="USERNAME"
                      value={adminUsername}
                      onChange={setAdminUsername}
                    />
                    <AdminProfileField
                      icon={<Sparkles className="h-4 w-4" />}
                      label="NAMA LENGKAP"
                      value={adminName}
                      onChange={setAdminName}
                    />
                    <AdminProfileField
                      icon={<Mail className="h-4 w-4" />}
                      label="EMAIL"
                      value={admin?.email || ""}
                      disabled
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="text-xs font-bold tracking-widest text-primary uppercase">Keamanan</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">Pastikan akun Anda tetap aman dengan menggunakan kata sandi yang kuat.</p>
                    <button
                      onClick={handleChangePassword}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Lock className="h-4 w-4" /> Ubah Password
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 TicketWave Admin Panel
          </p>
        </div>
      </main>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onSaved={handleCreated} />}
      {editEvent && (
        <AddEventModal
          onClose={() => setEditEvent(null)}
          onSaved={handleEditSaved}
          initialData={editEvent}
        />
      )}
      {confirmLogout && (
        <LogoutConfirm onCancel={() => setConfirmLogout(false)} onConfirm={handleLogout} />
      )}
      {showPwdModal && (
        <ChangePasswordModal
          value={newPwd}
          onChange={setNewPwd}
          onCancel={() => setShowPwdModal(false)}
          onConfirm={handleConfirmChangePassword}
        />
      )}
    </div>
  );
}

function ChangePasswordModal({ value, onChange, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 rounded-3xl border border-primary/30 bg-card p-6 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
        <div className="flex items-center gap-3 text-primary mb-6">
          <div className="rounded-xl bg-primary/10 p-3">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Ubah Kata Sandi</h2>
            <p className="text-xs text-muted-foreground">Masukkan kata sandi baru Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-xl border border-border bg-input/40 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-bold hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
          >
            Simpan Password
          </button>
        </div>
      </div>
    </div>
  );
}

function AddEventModal({
  onClose,
  onSaved,
  initialData,
}: {
  onClose: () => void;
  onSaved: (ev: EventItem) => void;
  initialData?: EventItem;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [artist, setArtist] = useState(initialData?.artist || "");
  const [genre, setGenre] = useState(initialData?.genre || "");
  const [date, setDate] = useState(initialData?.date || "");
  const [venue, setVenue] = useState(initialData?.venue || "");
  const [priceFrom, setPriceFrom] = useState<number | "">(initialData?.priceFrom || "");
  const [rating, setRating] = useState(initialData?.rating || 8.5);
  const [poster, setPoster] = useState(initialData?.poster || GRADIENTS[0]);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !genre || !date || !venue || !priceFrom) {
      return setError("Semua field wajib diisi.");
    }
    if (Number(priceFrom) < 1000) return setError("Harga minimal Rp 1.000.");

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("tw_admin_jwt="))
        ?.split("=")[1];

      if (!token || token.startsWith("mock.")) {
        const mockId = title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
        const newEv: EventItem = {
          id: mockId,
          dbId: Date.now(),
          title: title.trim(),
          artist: artist.trim(),
          genre: genre.trim(),
          date: date,
          venue: venue.trim(),
          priceFrom: Number(priceFrom),
          rating: Number(rating),
          poster: poster,
          accent: "#22d3ee",
        };
        addCustomEvent(newEv);
        onSaved(newEv);
        alert("Event disimpan secara LOKAL (Frontend) karena Anda sedang dalam mode demo/mock session.");
        return;
      }

      let targetId = initialData?.dbId;

      if (initialData) {
        // Update Event
        await fetch(`http://localhost:8080/api/admin/events/${targetId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            artist: artist.trim(),
            event_date: new Date(date).toISOString(),
            location: venue.trim(),
            image_url: poster,
          }),
        });

        // Fetch and Update Tickets
        const tRes = await fetch(`http://localhost:8080/api/events/${targetId}/tickets`);
        const tData = await tRes.json();
        if (tData.success && tData.data) {
          for (const t of tData.data) {
            let price = Number(priceFrom);
            if (t.category === "VIP") price = Number(priceFrom) * 2;
            else if (t.category === "Premium") price = Number(priceFrom) * 1.5;

            await fetch(`http://localhost:8080/api/admin/tickets/${t.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ price }),
            });
          }
        }
      } else {
        // [CREATE] Create Event
        const res = await fetch("http://localhost:8080/api/admin/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            artist: artist.trim(),
            genre: genre.trim(),
            event_date: new Date(date).toISOString(),
            location: venue.trim(),
            image_url: poster,
          }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        targetId = data.data.id;

        // Create Default Tickets (VIP, Premium, Regular)
        const categories = [
          { name: "VIP", price: Number(priceFrom) * 2, quota: 100 },
          { name: "Premium", price: Number(priceFrom) * 1.5, quota: 150 },
          { name: "Regular", price: Number(priceFrom), quota: 200 },
        ];

        for (const cat of categories) {
          await fetch("http://localhost:8080/api/admin/tickets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              event_id: targetId,
              category: cat.name,
              price: cat.price,
              quota: cat.quota,
              available_seats: cat.quota,
            }),
          });
        }
      } else {
        // Update Event
        await fetch(`http://localhost:8080/api/admin/events/${targetId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: artist.trim(),
            event_date: new Date(date).toISOString(),
            location: venue.trim(),
            image_url: poster,
          }),
        });

        // Fetch and Update Tickets
        const tRes = await fetch(`http://localhost:8080/api/events/${targetId}/tickets`);
        const tData = await tRes.json();
        if (tData.success && tData.data) {
          for (const t of tData.data) {
            let price = Number(priceFrom);
            if (t.category === "VIP") price = Number(priceFrom) * 2;
            else if (t.category === "Premium") price = Number(priceFrom) * 1.5;

            await fetch(`http://localhost:8080/api/admin/tickets/${t.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ price }),
            });
          }
        }
      }

      onSaved({} as EventItem); // mockData is no longer needed
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan event");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-display text-xl font-extrabold">
              {initialData ? "EDIT EVENT" : "TAMBAH EVENT BARU"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Isi detail event yang akan tayang di platform.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {/* Preview */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="relative aspect-[16/7]" style={getPosterStyle(poster)}>
              <div className="absolute inset-0 bg-grid opacity-30 mix-blend-overlay" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  {genre || "GENRE"}
                </p>
                <h4 className="font-display text-2xl font-extrabold text-white">
                  {title || "Judul Event"}
                </h4>
                <p className="text-sm text-white/80">{artist || "Nama Artis"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="JUDUL EVENT"
              value={title}
              onChange={setTitle}
              placeholder="Neon Dynasty"
            />
            <Input label="ARTIS" value={artist} onChange={setArtist} placeholder="Kage Riku" />
            <Input
              label="GENRE"
              value={genre}
              onChange={setGenre}
              placeholder="Cyberpunk / EDM / Pop"
            />
            <Input label="TANGGAL" value={date} onChange={setDate} placeholder="12 Jun 2026" />
            <Input
              label="VENUE"
              value={venue}
              onChange={setVenue}
              placeholder="GBK Senayan, Jakarta"
              className="sm:col-span-2"
            />
            <Input
              label="HARGA MULAI (Rp)"
              value={priceFrom === "" ? "" : String(priceFrom)}
              onChange={(v) => setPriceFrom(v === "" ? "" : Number(v.replace(/\D/g, "")))}
              placeholder="500000"
            />
            <div>
              <label className="mb-2 block text-xs font-bold tracking-widest text-muted-foreground">
                RATING ({rating.toFixed(1)})
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-[color:var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-muted-foreground">
              FOTO EVENT
            </label>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                placeholder="URL Foto (https://...)"
                className="flex-1 min-w-[200px] rounded-xl border border-border bg-input/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary"
              />
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/20 transition-colors">
                <Camera className="h-4 w-4" />
                <span>Upload</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={async (e) => {
                    if (!e.target.files?.[0]) return;
                    const file = e.target.files[0];
                    
                    // Show preview immediately using local URL
                    const localUrl = URL.createObjectURL(file);
                    setPoster(localUrl);

                    const formData = new FormData();
                    formData.append("foto", file);
                    
                    try {
                      const token = document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("tw_admin_jwt="))
                        ?.split("=")[1];

                      if (!token || token.startsWith("mock.")) {
                        console.warn("Mock session: Image only saved locally for this session.");
                        return;
                      }

                      const res = await fetch("http://localhost:8080/api/admin/events/upload", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                      });
                      const data = await res.json();
                      if (data.success) {
                        setPoster(`http://localhost:8080${data.data}`);
                      }
                    } catch (err) {
                      console.error("Upload failed, keeping local preview.");
                    }
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Atau pilih palet warna cepat:</p>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPoster(g)}
                  className={`aspect-square rounded-lg ring-2 transition-all ${poster === g ? "ring-primary scale-105" : "ring-transparent hover:ring-border"}`}
                  style={{ background: g }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
            >
              <Plus className="h-4 w-4" /> Simpan Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminProfileField({
  icon,
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <div className="flex-1">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
        {onChange && !disabled ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-primary/30 focus:border-primary font-medium focus:outline-none py-1 transition-colors text-sm"
          />
        ) : (
          <p className="font-medium text-sm py-1 border-b border-transparent">{value}</p>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-input/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

// ============== LOGOUT CONFIRM ==============
function LogoutConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-destructive/40 bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
          <LogOut className="h-5 w-5 text-destructive" />
        </div>
        <h3 className="font-display text-xl font-extrabold">Keluar dari Admin Panel?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Session admin akan diakhiri dan cookie JWT dihapus.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:opacity-90"
          >
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
      <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.25em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/15 text-primary font-semibold ring-1 ring-primary/30" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
    >
      <span className={active ? "text-primary" : ""}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({
  title,
  value,
  trend,
  trendColor,
  accent,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  trend: string;
  trendColor: string;
  accent: string;
  icon: React.ReactNode;
}) {
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

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
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
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--destructive)"
          strokeWidth="12"
          strokeDasharray={`${sold} ${c}`}
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--warning)"
          strokeWidth="12"
          strokeDasharray={`${locked} ${c}`}
          strokeDashoffset={-sold}
        />
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
          <div
            key={i}
            className="flex-1 rounded-t bg-primary/70 transition-all hover:bg-primary"
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {labels.map((l) => (
          <div key={l} className="flex-1 text-center text-[10px] text-muted-foreground">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

const getPosterStyle = (poster: string) => {
  if (poster.startsWith("http") || poster.startsWith("/") || poster.includes(".")) {
    return { 
      backgroundImage: `url(${poster})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center' 
    };
  }
  return { background: poster };
};

