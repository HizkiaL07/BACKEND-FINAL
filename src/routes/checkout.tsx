import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle, Wallet, Building2, CheckCircle2, Loader } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatIDR } from "@/lib/mockData";
import { BackButton } from "@/components/BackButton";
import { getUser, confirmTransaction } from "@/lib/auth";

type CheckoutData = {
  eventId: string;
  dbEventId: number;
  ticketId: number;
  seats: string[]; // 👈 Diubah dari 'seat: string' menjadi array
  totalPrice: number; // 👈 Gunakan totalPrice yang dikirim dari halaman detail
  quantity: number;
  transactionId: string;
  expiresAt: number;
};

const idToSlug: Record<number, string> = {
  1: "neon-dynasty",
  2: "frozen-horizon",
  3: "solar-bloom",
  4: "midnight-drift",
  5: "echo-garden",
  6: "voltage-nights",
};

export const Route = createFileRoute("/checkout")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getUser()) {
      throw redirect({ to: "/login" });
    }
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [now, setNow] = useState(Date.now());
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ev, setEv] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("tw_checkout");
    if (!raw) {
      navigate({ to: "/" });
      return;
    }
    try {
      const parsed = JSON.parse(raw);

      if (!parsed.transactionId || parsed.transactionId === "NaN") {
        setError("ID Transaksi tidak valid. Silakan pesan ulang.");
        return;
      }

      setData(parsed);
    } catch (e) {
      setError("Data pemesanan korup.");
    }
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = data ? Math.max(0, data.expiresAt - now) : 0;
  const expired = data && remaining === 0 && !paid;

  useEffect(() => {
    if (expired && data) {
      sessionStorage.removeItem("tw_checkout");
      alert("Waktu habis, kursi dilepas.");
      const slug = idToSlug[Number(data.dbEventId)] || data.eventId;
      navigate({ to: `/event/${slug}` });
    }
  }, [expired, data, navigate]);

  useEffect(() => {
    if (!data) return;
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/events/${data.dbEventId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const e = json.data;
          setEv({
            id: e.id.toString(),
            dbId: e.id,
            title: e.title,
            artist: e.artist || e.description || "Artist",
            genre: e.genre || "Concert",
            date: new Date(e.event_date).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            venue: e.location,
            priceFrom: e.tickets?.[0]?.price || 100000,
            poster: e.image_url || "linear-gradient(135deg,#0ea5e9,#a855f7,#ec4899)",
          });
        }
      } catch (err) {
        console.error("Failed to fetch event", err);
      }
    };
    fetchEvent();
  }, [data]);

  if (!data || !ev) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[50vh] items-center justify-center text-white">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const pct = (remaining / (5 * 60 * 1000)) * 100;

  const [showQR, setShowQR] = useState(false);

  const handlePay = async (method: string) => {
    if (paying || paid || !data.transactionId) return;

    if (method === "qris" && !showQR) {
      setShowQR(true);
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const txId = String(data.transactionId);
      const result = await confirmTransaction(txId, method);

      if (result.success) {
        sessionStorage.removeItem("tw_checkout");
        setPaid(true);
        setTimeout(() => navigate({ to: "/my-tickets" }), 1500);
      } else {
        setError(result.message || "Pembayaran gagal");
        setPaying(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setPaying(false);
    }
  };

  return (
    <>
      <Navbar />
      {paid ? (
        <main className="grid min-h-[70vh] place-items-center px-4 text-white">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="mt-4 font-display text-3xl font-bold">Pembayaran Berhasil</h1>
            <p className="mt-2 text-muted-foreground">Mengarahkan ke My Tickets…</p>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 text-white">
          <BackButton label="Batal & Pilih Kursi Lain" fallback="/" />
          <h1 className="mt-4 font-display text-3xl font-extrabold uppercase italic tracking-tighter">
            CHECKOUT
          </h1>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          <section className="mt-6 overflow-hidden rounded-2xl border border-primary/40 bg-card p-6 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Sisa waktu
                  </p>
                  <p className="font-display text-5xl font-extrabold tabular-nums text-primary sm:text-6xl">
                    {mm}:{ss}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </section>

          <section className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold">RINGKASAN PESANAN</h2>
              <div className="mt-4 flex gap-4">
                <div
                  className="h-24 w-20 shrink-0 rounded-lg bg-cover bg-center border border-border"
                  style={ev.poster.startsWith("http") || ev.poster.startsWith("/") || ev.poster.includes(".") 
                    ? { backgroundImage: `url(${ev.poster})` } 
                    : { background: ev.poster }}
                />
                <div className="flex-1">
                  <p className="font-display text-xl font-bold">{ev.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {ev.artist} · {ev.date}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
                <Row
                  k="Nomor Kursi"
                  v={<span className="font-bold text-primary">{data.seats.join(", ")}</span>}
                />
                <Row k="Jumlah Tiket" v={`${data.quantity} Tiket`} />
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-lg font-bold">Total Tagihan</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    {formatIDR(data.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 h-fit">
              <h2 className="font-display text-lg font-bold">METODE PEMBAYARAN</h2>
              <div className="mt-4 space-y-3">
                {showQR ? (
                  <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                    <p className="text-xs font-bold tracking-widest text-primary">SCAN QRIS UNTUK MEMBAYAR</p>
                    <div className="mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border border-border bg-white p-2">
                      <img 
                        src="http://localhost:8080/uploads/qris_mock_qr.png" 
                        alt="QRIS QR Code" 
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => handlePay("qris")}
                      disabled={paying}
                      className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                    >
                      {paying ? <Loader className="mx-auto h-4 w-4 animate-spin" /> : "SELESAI PEMBAYARAN"}
                    </button>
                    <button
                      onClick={() => setShowQR(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Ganti Metode Pembayaran
                    </button>
                  </div>
                ) : (
                  <>
                    <PayBtn
                      icon={<div className="font-bold">QRIS</div>}
                      label="QRIS"
                      sub="Scan QR Code"
                      onClick={() => handlePay("qris")}
                      loading={paying}
                    />
                    <PayBtn
                      icon={<Building2 />}
                      label="VA Account"
                      sub="Virtual Account"
                      onClick={() => handlePay("va")}
                      loading={paying}
                    />
                    <PayBtn
                      icon={<Wallet />}
                      label="E-Wallet"
                      sub="GoPay / OVO"
                      onClick={() => handlePay("ewallet")}
                      loading={paying}
                    />
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function PayBtn({ icon, label, sub, onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 hover:border-primary/60 transition-all disabled:opacity-50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {loading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      )}
    </button>
  );
}
