# Integrasi Sistem Menu ke Database - Ringkasan Perubahan

## 📋 Daftar Perubahan yang Dilakukan

### 1. Backend - Go

#### A. Models (models/models.go)

✅ **Menambah Menu Model** dengan struktur:

- `ID` - Primary key
- `Name` - Unique identifier
- `Label` - Display name
- `Icon` - Icon reference
- `Path` - Route path
- `Order` - Display order
- `Role` - Access control (public/user/admin)
- `IsActive` - Status aktif/tidak aktif
- `ParentID` - Support untuk submenu
- `Children` - Relation untuk submenu

#### B. Handlers (handlers/menu.go) - FILE BARU

✅ **Menambah 6 Handler Functions:**

1. `GetAllMenus()` - GET /api/menus - Mengambil semua menu berdasarkan role
2. `GetMenuByID()` - GET /api/menus/:id - Mengambil menu spesifik
3. `CreateMenu()` - POST /api/admin/menus - Membuat menu baru
4. `UpdateMenu()` - PUT /api/admin/menus/:id - Update menu
5. `DeleteMenu()` - DELETE /api/admin/menus/:id - Hapus menu
6. `BulkCreateMenus()` - POST /api/admin/menus/bulk - Buat banyak menu sekaligus

#### C. Main (main.go)

✅ **3 Perubahan:**

1. **AutoMigrate** - Tambah `&models.Menu{}` ke database migration
2. **seedDefaultMenus()** - Fungsi baru untuk seed menu default ke database:
   - Public menus: Home, Explore Events, My Tickets
   - Admin menus: Dashboard, Events, Tickets, Transactions, Users, Menu Settings
3. **Routes:**
   - Public routes: `GET /api/menus`, `GET /api/menus/:id`
   - Admin routes: `POST /api/admin/menus`, `POST /api/admin/menus/bulk`, `PUT /api/admin/menus/:id`, `DELETE /api/admin/menus/:id`

---

### 2. Frontend - React/TypeScript

#### A. Utilities (src/lib/menus.ts) - FILE BARU

✅ **Menu Utilities Library** dengan fungsi:

- `fetchMenus(role)` - Ambil menu dari API
- `fetchMenuById(id)` - Ambil menu spesifik
- `getUserRole()` - Dapatkan role user dari localStorage
- `buildMenuHierarchy()` - Buat struktur parent-child dari flat list
- `flattenMenus()` - Ubah hierarchical ke flat list
- `getBreadcrumbPath()` - Generate breadcrumb trail

#### B. Components (src/components/NavbarDynamic.tsx) - FILE BARU

✅ **Dynamic Navbar Component** dengan fitur:

- Fetch menus dari API dynamically
- Filter berdasarkan role user
- Support desktop dan mobile navigation
- Mobile menu toggle
- Integration dengan existing auth system
- Loading states

#### C. Type Definitions

```typescript
export interface MenuItem {
  id: number;
  name: string;
  label: string;
  icon?: string;
  path: string;
  order: number;
  role: string;
  is_active: boolean;
  parent_id?: number;
  children?: MenuItem[];
  created_at?: string;
  updated_at?: string;
}
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE menus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  icon VARCHAR(100),
  path VARCHAR(255),
  order INT DEFAULT 0,
  role VARCHAR(20) DEFAULT 'public',
  is_active BOOLEAN DEFAULT true,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE CASCADE
);
```

---

## 📡 API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint                 | Description                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/api/menus?role=public` | Ambil semua menu untuk role tertentu |
| GET    | `/api/menus/:id`         | Ambil menu spesifik beserta children |

**Example Response:**

```json
{
  "success": true,
  "message": "Menu berhasil diambil",
  "data": {
    "menus": [
      {
        "id": 1,
        "name": "home",
        "label": "Home",
        "icon": "home",
        "path": "/",
        "order": 1,
        "role": "public",
        "is_active": true,
        "parent_id": null,
        "children": [],
        "created_at": "2024-04-25T00:00:00Z"
      }
    ]
  }
}
```

### Admin Endpoints (Auth + Admin Role Required)

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| POST   | `/api/admin/menus`      | Buat menu baru             |
| POST   | `/api/admin/menus/bulk` | Buat banyak menu sekaligus |
| PUT    | `/api/admin/menus/:id`  | Update menu                |
| DELETE | `/api/admin/menus/:id`  | Hapus menu                 |

---

## 🚀 Default Menus (Auto-seeded)

Ketika server pertama kali dijalankan, sistem akan otomatis membuat menu-menu berikut:

### User Menus

1. **Home** - `/` - order: 1
2. **Explore Events** - `/` - order: 2
3. **My Tickets** - `/my-tickets` - order: 3

### Admin Menus

1. **Dashboard** - `/admin` - order: 1
2. **Events Management** - `/admin/events` - order: 2
3. **Tickets Management** - `/admin/tickets` - order: 3
4. **Transactions** - `/admin/transactions` - order: 4
5. **Users Management** - `/admin/users` - order: 5
6. **Menu Settings** - `/admin/menus` - order: 6

---

## 📁 Files Affected/Created

### Created Files:

- ✅ `handlers/menu.go` - Menu CRUD handlers
- ✅ `TICKETTWARR/src/lib/menus.ts` - Frontend menu utilities
- ✅ `TICKETTWARR/src/components/NavbarDynamic.tsx` - Dynamic navbar component
- ✅ `MENU_SYSTEM_DOCUMENTATION.md` - Complete documentation

### Modified Files:

- ✅ `models/models.go` - Added Menu model
- ✅ `main.go` - Added menu routes, migrations, and seeding

---

## 🔧 How to Use

### Backend Setup

1. Backend akan otomatis membuat tabel dan seed menu default saat first run
2. Menu bisa dimanage melalui API endpoints

### Frontend Setup

1. **Replace Navbar di existing app:**

   ```typescript
   // Before:
   import { Navbar } from "@/components/Navbar";

   // After:
   import { NavbarDynamic } from "@/components/NavbarDynamic";

   export default function Root() {
     return (
       <>
         <NavbarDynamic /> {/* Now fetches menus dynamically */}
         {/* rest of app */}
       </>
     );
   }
   ```

2. **Gunakan menu utilities:**

   ```typescript
   import { fetchMenus, getUserRole } from "@/lib/menus";

   const role = getUserRole();
   const menus = await fetchMenus(role);
   ```

---

## ✨ Fitur-Fitur

✅ **Role-Based Menu Control** - Kontrol akses berdasarkan user role
✅ **Hierarchical Menus** - Support parent-child relationships
✅ **Dynamic Ordering** - Atur urutan menu via `order` field
✅ **Enable/Disable Menus** - Toggle menu status tanpa menghapus
✅ **Icon Support** - Setiap menu bisa punya icon
✅ **Submenu Support** - Buat nested menus via parent_id
✅ **Bulk Operations** - Buat banyak menu sekaligus
✅ **Automatic Seeding** - Default menus auto-created
✅ **Admin Dashboard** - Manage menus via admin API

---

## 🧪 Testing

### Test Backend Routes

```bash
# Get public menus
curl http://localhost:8080/api/menus?role=public

# Get menu by ID
curl http://localhost:8080/api/menus/1

# Create menu (need admin token)
curl -X POST http://localhost:8080/api/admin/menus \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "blog",
    "label": "Blog",
    "path": "/blog",
    "icon": "file-text",
    "order": 4,
    "role": "public"
  }'

# Bulk create menus
curl -X POST http://localhost:8080/api/admin/menus/bulk \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menus": [
      {"name": "about", "label": "About", "path": "/about", "order": 5},
      {"name": "contact", "label": "Contact", "path": "/contact", "order": 6}
    ]
  }'
```

---

## 📝 Next Steps (Optional Enhancements)

1. **Admin Dashboard** - Buat UI untuk manage menus
2. **Menu Caching** - Implement caching untuk performance
3. **Breadcrumb Component** - Buat breadcrumb berdasarkan menu hierarchy
4. **Menu Permissions** - Fine-grained access control
5. **Menu Analytics** - Track menu usage
6. **Sidebar Component** - Implementasi sidebar navigation

---

## 🔒 Security

- ✅ Admin endpoints dilindungi middleware authentication
- ✅ Role-based access control
- ✅ Input validation di semua endpoints
- ✅ XSS protection via React escaping
- ✅ CORS configured untuk trusted origins

---

## 📊 Summary

| Aspek                      | Details                                 |
| -------------------------- | --------------------------------------- |
| **Backend Files Modified** | 2 (main.go, models.go)                  |
| **Backend Files Created**  | 1 (handlers/menu.go)                    |
| **Frontend Files Created** | 2 (menus.ts, NavbarDynamic.tsx)         |
| **API Endpoints**          | 6 (2 public, 4 admin)                   |
| **Default Menus**          | 9 menus (3 user, 6 admin)               |
| **DB Tables**              | 1 new table (menus)                     |
| **Documentation**          | Complete (MENU_SYSTEM_DOCUMENTATION.md) |

---

**Status:** ✅ **COMPLETED**

Sistem menu telah berhasil diintegrasikan ke database dengan support untuk:

- Role-based access control
- Hierarchical menu structure
- Dynamic frontend rendering
- Admin management endpoints
- Auto-seeding default menus
