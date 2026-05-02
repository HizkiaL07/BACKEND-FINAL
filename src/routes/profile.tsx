import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { getUser, logout, getMyTickets } from "@/lib/auth";
import { BackButton } from "@/components/BackButton";
import { useEffect, useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Ticket as TicketIcon,
  LogOut,
  ChevronRight,
  Edit2,
  Check,
  X,
  Phone,
  MapPin,
  Camera,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getUser()) {
      throw redirect({ to: "/login" });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const user = getUser();
  const [ticketCount, setTicketCount] = useState(0);

  // --- STATE EDIT ---
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPhone, setNewPhone] = useState(user?.phone_number || "");
  const [newAddress, setNewAddress] = useState(user?.address || "");
  const [newPassword, setNewPassword] = useState("");
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      const res = await getMyTickets();
      if (res.success) {
        setTicketCount(res.data.length);
      }
    }
    fetchStats();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tw_token");
      const response = await fetch("http://localhost:8080/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: newName,
          email: newEmail,
          password: newPassword,
          phone_number: newPhone,
          address: newAddress,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const oldUserStr = localStorage.getItem("tw_user");
        if (oldUserStr) {
          const oldUser = JSON.parse(oldUserStr);
          const updatedUser = { 
            ...oldUser, 
            name: newName, 
            email: newEmail,
            phone_number: newPhone,
            address: newAddress
          };
          localStorage.setItem("tw_user", JSON.stringify(updatedUser));
        }

        setIsEditing(false);
        setNewPassword("");
        alert("Profil dan Keamanan berhasil diperbarui!");
        window.location.reload();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", e.target.files[0]);

    try {
      const token = localStorage.getItem("tw_token");
      const response = await fetch("http://localhost:8080/api/profile/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setAvatar(result.data);
        const oldUserStr = localStorage.getItem("tw_user");
        if (oldUserStr) {
          const oldUser = JSON.parse(oldUserStr);
          localStorage.setItem("tw_user", JSON.stringify({ ...oldUser, avatar_url: result.data }));
        }
        alert("Foto profil berhasil diperbarui!");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Gagal upload foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 text-white">
        <BackButton label="Kembali ke Beranda" fallback="/" />

        <section className="flex flex-col items-center text-center mt-6">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-1 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-background overflow-hidden relative">
                {avatar ? (
                  <img src={`http://localhost:8080${avatar}`} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-4xl font-black text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                
                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ganti Foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-success p-1.5 border-4 border-background">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 justify-center">
            <Mail className="h-3 w-3" /> {user.email}
          </p>
          <div className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            {user.role || "Verified Member"}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mt-10 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Tiket</p>
            <p className="mt-1 font-display text-3xl font-bold text-primary">{ticketCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Status Akun</p>
            <p className="mt-1 font-display text-3xl font-bold text-success">Aktif</p>
          </div>
        </section>

        {/* Informasi Akun */}
        <section className="mt-10 space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Informasi Akun
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Edit2 className="h-3 w-3" /> Edit Profil
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs font-bold text-success hover:underline"
                >
                  <Check className="h-3 w-3" /> {loading ? "Saving..." : "Simpan"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewName(user.name);
                    setNewEmail(user.email);
                    setNewPassword("");
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
                >
                  <X className="h-3 w-3" /> Batal
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* FIELD EMAIL */}
            <EditableInfoItem
              icon={<Mail />}
              label="Email"
              value={user.email}
              isEditing={isEditing}
              inputValue={newEmail}
              onChange={(v) => setNewEmail(v)}
            />

            <div className="h-px bg-border mx-4" />

            {/* FIELD NAMA LENGKAP */}
            <EditableInfoItem
              icon={<User />}
              label="Nama Lengkap"
              value={user.name}
              isEditing={isEditing}
              inputValue={newName}
              onChange={(v) => setNewName(v)}
            />

            <div className="h-px bg-border mx-4" />

            {/* FIELD TELEPON */}
            <EditableInfoItem
              icon={<Phone />}
              label="Nomor Telepon"
              value={user.phone_number || "Belum diatur"}
              isEditing={isEditing}
              inputValue={newPhone}
              onChange={(v) => setNewPhone(v)}
              placeholder="0812xxxx"
            />

            <div className="h-px bg-border mx-4" />

            {/* FIELD ALAMAT */}
            <EditableInfoItem
              icon={<MapPin />}
              label="Alamat"
              value={user.address || "Belum diatur"}
              isEditing={isEditing}
              inputValue={newAddress}
              onChange={(v) => setNewAddress(v)}
              placeholder="Jl. Merdeka No. 1..."
            />

            <div className="h-px bg-border mx-4" />

            {/* FIELD PASSWORD (BARU) */}
            <div className={`flex items-center gap-4 p-4 transition-all ${isEditing ? 'bg-primary/5' : ''}`}>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Kata Sandi
                </p>
                {isEditing ? (
                  <input
                    type="password"
                    className="w-full bg-transparent border-b border-primary font-medium focus:outline-none text-white placeholder:text-gray-600"
                    placeholder="Masukkan password baru jika ingin mengganti"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-white/50 italic text-sm">
                    •••••••••••• (Terproteksi)
                  </p>
                )}
              </div>
            </div>
          </div>

          <h2 className="mt-8 px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Pengaturan
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <LinkTo icon={<TicketIcon />} label="Lihat Tiket Saya" to="/my-tickets" />
            <div className="h-px bg-border mx-4" />
            <button
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-red-500/5 group"
            >
              <div className="flex items-center gap-4 text-red-500">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-semibold">Keluar dari Akun</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-red-500" />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

// Komponen Helper Baru untuk mempermudah Edit
function EditableInfoItem({
  icon,
  label,
  value,
  isEditing,
  inputValue,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  inputValue: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {isEditing ? (
          <input
            className="w-full bg-transparent border-b border-primary/50 focus:border-primary font-medium focus:outline-none py-1 transition-colors"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <p className="font-medium text-white">{value}</p>
        )}
      </div>
    </div>
  );
}

function LinkTo({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-4 transition-colors hover:bg-muted group text-white"
    >
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        <span className="font-semibold">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
