import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, MapPin, Star, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { EVENTS, formatIDR, getAllEvents, type EventItem } from "@/lib/mockData";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getUser()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Explore Events — TicketWave" },
      {
        name: "description",
        content: "Jelajahi konser dan event terbaik. Pesan tiket dengan seat locking real-time.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [q, setQ] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log("Fetching events from API...");
        const res = await fetch("http://localhost:8080/api/events");
        const json = await res.json();
        console.log("API Response:", json);
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((e: any) => ({
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
            rating: e.rating || 9.0,
            poster: e.image_url || "linear-gradient(135deg,#0ea5e9,#a855f7,#ec4899)",
            accent: "#22d3ee",
          }));
          console.log("Mapped Events:", mapped);
          setEvents(mapped);
        } else {
          console.warn("API success but data is not an array or success is false");
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };
    fetchEvents();
  }, []);

  const filtered = useMemo(
    () =>
      events.filter((e) => (e.title + e.artist + e.genre).toLowerCase().includes(q.toLowerCase())),
    [q, events],
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <section className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> {events.length} EVENT AKTIF
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
            JELAJAHI <span className="text-primary text-glow">EVENT</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Pilih event favoritmu, kunci kursi terbaik dalam hitungan detik.
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 backdrop-blur focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
            <Search className="h-4 w-4 text-primary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama artis, event, atau genre…"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard key={e.id} ev={e} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-16 text-center text-muted-foreground">
              Tidak ada event yang cocok.
            </p>
          )}
        </section>
      </main>
    </>
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


function EventCard({ ev }: { ev: (typeof EVENTS)[number] }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-[var(--shadow-glow)]">
      <div className="relative aspect-[4/5] overflow-hidden" style={getPosterStyle(ev.poster)}>
        <div className="absolute inset-0 bg-grid opacity-30 mix-blend-overlay" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          <Star className="h-3 w-3 fill-primary text-primary" /> {ev.rating}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">{ev.genre}</p>
          <h3 className="font-display text-2xl font-extrabold text-white">{ev.title}</h3>
          <p className="text-sm text-white/80">{ev.artist}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" /> {ev.date}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" /> {ev.venue}
        </div>
        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Mulai dari</p>
            <p className="font-display text-xl font-bold text-primary">{formatIDR(ev.priceFrom)}</p>
          </div>
          <Link
            to="/event/$eventId"
            params={{ eventId: ev.id }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Lihat Detail <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
