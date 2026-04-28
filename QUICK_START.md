# 🚀 Quick Start Guide - Menu System

## 1️⃣ Backend Setup

### Step 1: Restart Backend Server

```bash
cd d:\MONICA\BACK END\FINAL_BACKEND
go run main.go
```

**Expected Output:**

```
✅ Database migration berhasil
🌱 Seeding default menus...
✅ Berhasil seed 9 default menus
🚀 Server Ticketing berjalan di http://localhost:8080
```

### Step 2: Verify Backend

```bash
# Test health check
curl http://localhost:8080/api/health

# Get all public menus
curl http://localhost:8080/api/menus?role=public

# Get user menus (requires user role)
curl http://localhost:8080/api/menus?role=user
```

---

## 2️⃣ Frontend Setup

### Step 1: Update Root Layout

Buka file yang menampilkan `Navbar`:

```typescript
// src/routes/__root.tsx atau tempat Navbar digunakan

// BEFORE:
import { Navbar } from "@/components/Navbar";

// AFTER:
import { NavbarDynamic } from "@/components/NavbarDynamic";

export default function RootLayout() {
  return (
    <div>
      <NavbarDynamic /> {/* Changed to dynamic navbar */}
      <Outlet />
    </div>
  );
}
```

### Step 2: Test Frontend

```bash
cd TICKETTWARR
npm run dev
```

Navbar sekarang akan menampilkan menu yang diambil dari database!

---

## 3️⃣ Admin Menu Management

### Login as Admin

```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Simpan JWT token dari response.

### Create New Menu

```bash
curl -X POST http://localhost:8080/api/admin/menus \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "products",
    "label": "Products",
    "icon": "shopping-bag",
    "path": "/products",
    "order": 4,
    "role": "public"
  }'
```

### Update Menu

```bash
curl -X PUT http://localhost:8080/api/admin/menus/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "New Label",
    "order": 10
  }'
```

### Disable/Enable Menu

```bash
# Disable menu
curl -X PUT http://localhost:8080/api/admin/menus/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

### Delete Menu

```bash
curl -X DELETE http://localhost:8080/api/admin/menus/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4️⃣ Default Menus

Sistem sudah membuat menu-menu ini otomatis:

### User Menus

```
🏠 Home (/)
🎯 Explore Events (/)
🎫 My Tickets (/my-tickets)
```

### Admin Menus

```
📊 Dashboard (/admin)
📅 Events Management (/admin/events)
🎫 Tickets Management (/admin/tickets)
💳 Transactions (/admin/transactions)
👥 Users Management (/admin/users)
⚙️  Menu Settings (/admin/menus)
```

---

## 5️⃣ Common Tasks

### Add New Menu Item

```bash
# 1. Get admin token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.data.token')

# 2. Create menu
curl -X POST http://localhost:8080/api/admin/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "blog",
    "label": "Blog",
    "icon": "file-text",
    "path": "/blog",
    "order": 5,
    "role": "public"
  }'
```

### Create Submenu

```bash
# Submenu untuk "Admin" parent (ID: 4)
curl -X POST http://localhost:8080/api/admin/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin-settings",
    "label": "Settings",
    "icon": "settings",
    "path": "/admin/settings",
    "order": 1,
    "role": "admin",
    "parent_id": 4
  }'
```

### Bulk Create Menus

```bash
curl -X POST http://localhost:8080/api/admin/menus/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menus": [
      {
        "name": "about",
        "label": "About Us",
        "icon": "info",
        "path": "/about",
        "order": 6,
        "role": "public"
      },
      {
        "name": "contact",
        "label": "Contact",
        "icon": "mail",
        "path": "/contact",
        "order": 7,
        "role": "public"
      },
      {
        "name": "faq",
        "label": "FAQ",
        "icon": "help-circle",
        "path": "/faq",
        "order": 8,
        "role": "public"
      }
    ]
  }'
```

---

## 6️⃣ Using Menu Utilities in Components

```typescript
// In any component
import { fetchMenus, getUserRole, buildMenuHierarchy } from "@/lib/menus";
import { useEffect, useState } from "react";

export function MyComponent() {
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    const loadMenus = async () => {
      const role = getUserRole();
      const menuList = await fetchMenus(role);

      // Optional: build hierarchy
      const hierarchical = buildMenuHierarchy(menuList);

      setMenus(hierarchical);
    };

    loadMenus();
  }, []);

  return (
    <div>
      {menus.map(menu => (
        <div key={menu.id}>
          <a href={menu.path}>{menu.label}</a>
        </div>
      ))}
    </div>
  );
}
```

---

## 7️⃣ Troubleshooting

### Menu tidak muncul di navbar

```
❌ Solusi:
1. Cek backend console - pastikan menu sudah di-seed
2. Buka DevTools (F12) > Network > cek GET /api/menus
3. Pastikan response status 200
4. Verifikasi role user sesuai filter
5. Pastikan is_active = true
```

### API returns 403 Forbidden

```
❌ Solusi:
1. Pastikan JWT token valid
2. Cek role user = "admin"
3. Gunakan Authorization header: Bearer YOUR_TOKEN
```

### CORS Error

```
❌ Solusi:
1. Restart backend server
2. Pastikan frontend URL di CORS whitelist
3. Cek main.go CORS config
```

### Database migration error

```
❌ Solusi:
1. Backup database lama
2. Pastikan database user memiliki CREATE TABLE permission
3. Drop tabel menus dan restart server
```

---

## 📚 Documentation Files

- **MENU_SYSTEM_DOCUMENTATION.md** - Dokumentasi lengkap
- **INTEGRATION_SUMMARY.md** - Ringkasan integrasi
- **QUICK_START.md** - File ini (quick reference)

---

## ✅ Verification Checklist

- [ ] Backend server running tanpa error
- [ ] `GET /api/menus?role=public` return 200
- [ ] NavbarDynamic component imported dan digunakan
- [ ] Frontend menampilkan menu dari database
- [ ] Admin dapat create/update/delete menu
- [ ] Default 9 menus sudah ada di database

---

## 🎯 Next Steps

1. ✅ Implementasikan admin UI untuk menu management
2. ✅ Test di production environment
3. ✅ Setup menu caching untuk performance
4. ✅ Create breadcrumb component
5. ✅ Create sidebar navigation (opsional)

---

**Happy coding! 🎉**
