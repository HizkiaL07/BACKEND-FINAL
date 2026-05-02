export type User = { name: string; email: string; id?: number; role?: string };

const KEY = "tw_user";
const API_BASE = "http://localhost:8080/api";

// ============== API CALLS ==============

/**
 * Register user ke backend
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; data?: User }> {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Login user ke backend
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; data?: { token: string; user: User } }> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.success && result.data?.token) {
      // Simpan token dan user info
      localStorage.setItem("tw_token", result.data.token);
      const user: User = {
        name: result.data.user?.name || email.split("@")[0],
        email: result.data.user?.email || email,
        id: result.data.user?.id,
        role: result.data.user?.role,
      };
      setUser(user);
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ============== LOCAL STORAGE ==============

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tw_token");
}

export function setUser(u: User) {
  localStorage.setItem(KEY, JSON.stringify(u));
  // Simulated JWT cookie
  document.cookie = `tw_jwt=mock.${btoa(u.email)}.token; path=/; max-age=86400`;
}

export function logout() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("tw_token");
  document.cookie = "tw_jwt=; path=/; max-age=0";
}

/**
 * Create transaction (checkout)
 */
export async function createTransaction(
  eventId: number,
  ticketId: number,
  quantity: number,
): Promise<{ success: boolean; message: string; data?: any }> {
  const token = getToken();
  if (!token) return { success: false, message: "Silakan login dahulu" };

  try {
    // Konversi eksplisit ke Number untuk memastikan Gin Gonic bisa melakukan unmarshal ke uint/int
    const payload = {
      event_id: Number(eventId),
      ticket_id: Number(ticketId),
      quantity: Number(quantity),
    };

    console.log("🚀 Payload dikirim ke Go:", payload);

    const response = await fetch(`${API_BASE}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("📥 Respon Backend Go:", result);

    if (!response.ok) {
      throw new Error(result.message || "Gagal membuat transaksi");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Confirm transaction (payment)
 */
export async function confirmTransaction(
  transactionId: string,
  paymentMethod: string,
): Promise<{ success: boolean; message: string; data?: any }> {
  const token = getToken();
  if (!token) {
    return {
      success: false,
      message: "Tidak ada token, silakan login terlebih dahulu",
    };
  }

  try {
    const response = await fetch(`${API_BASE}/transactions/${transactionId}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ payment_method: paymentMethod }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Update tipe data Ticket sesuai response database/join
export type Ticket = {
  id: string; // transaction_id
  user_id: number;
  event_id: number;
  event_title: string; // Hasil join atau mapping
  seats?: string[]; // 👈 Tambahkan ini jika backend mengirim array
  seat?: string;
  seat_number: string;
  price: number;
  total_price?: number;
  date: string;
  status: string;
  purchased_at: string;
};

/**
 * Fetch tiket milik user dari Database (melalui Backend Go)
 */
export async function getMyTickets(): Promise<{
  success: boolean;
  data: Ticket[];
  message?: string;
}> {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const response = await fetch(`${API_BASE}/transactions/my`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    // Pastikan backend mengembalikan success: true dan data dalam bentuk array
    if (response.ok && result.success) {
      return result;
    }
    return { success: false, data: [], message: result.message };
  } catch (error) {
    console.error("Fetch tickets error:", error);
    return { success: false, data: [] };
  }
}

const TKEY = "tw_tickets";

export function getTickets(email: string): Ticket[] {
  try {
    const raw = localStorage.getItem(TKEY);
    const all: Ticket[] = raw ? JSON.parse(raw) : [];
    return all.filter((t) => t.user === email);
  } catch {
    return [];
  }
}

export function addTicket(t: Ticket) {
  const raw = localStorage.getItem(TKEY);
  const all: Ticket[] = raw ? JSON.parse(raw) : [];
  all.push(t);
  localStorage.setItem(TKEY, JSON.stringify(all));
}

// ============== ADMIN AUTH ==============
export type Admin = { name: string; username: string; email: string; role: "SUPER ADMIN" | "ADMIN" };
const AKEY = "tw_admin";

// Hardcoded credentials dihapus karena menggunakan real backend API

export function getAdmin(): Admin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AKEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdmin(a: Admin) {
  localStorage.setItem(AKEY, JSON.stringify(a));
  document.cookie = `tw_admin_jwt=mock.${btoa(a.email)}.adm; path=/; max-age=86400`;
}

export async function updateAdmin(updates: any): Promise<{ success: boolean; message: string }> {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("tw_admin_jwt="))
    ?.split("=")[1];

  if (!token) return { success: false, message: "Sesi tidak valid" };

  try {
    const response = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    if (result.success) {
      const current = getAdmin();
      if (current) {
        const updated = {
          ...current,
          name: result.data.full_name || current.name,
          username: result.data.username || current.username,
        };
        setAdmin(updated);
      }
      return { success: true, message: result.message };
    }
    return { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: "Network error" };
  }
}

export function adminLogout() {
  localStorage.removeItem(AKEY);
  document.cookie = "tw_admin_jwt=; path=/; max-age=0";
}

export async function loginAdmin(email: string, password: string): Promise<Admin | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.success && result.data?.token) {
      const admin: Admin = {
        name: result.data.user?.name || email.split("@")[0],
        username: result.data.user?.username || "",
        email: result.data.user?.email || email,
        role: "ADMIN",
      };

      // Simpan admin di localStorage
      localStorage.setItem(AKEY, JSON.stringify(admin));
      // Simpan token admin yang sebenarnya
      document.cookie = `tw_admin_jwt=${result.data.token}; path=/; max-age=86400`;

      return admin;
    }
    return null;
  } catch (error) {
    console.error("Admin login error:", error);
    return null;
  }
}
