# Menu System Documentation

## Overview

Sistem menu dinamis yang terhubung ke database untuk manajemen navigasi yang fleksibel dan mudah dikonfigurasi.

## Database Schema

### Menu Table

```sql
CREATE TABLE menus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  icon VARCHAR(100),
  path VARCHAR(255),
  order INT DEFAULT 0,
  role VARCHAR(20) DEFAULT 'public',  -- public, user, admin
  is_active BOOLEAN DEFAULT true,
  parent_id INT NULL,                 -- untuk submenu
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES menus(id)
);
```

## Backend API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Get All Menus

```bash
GET /api/menus?role=public
```

**Response:**

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
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### 2. Get Menu by ID

```bash
GET /api/menus/:id
```

### Admin Endpoints (Authentication + Admin Role Required)

#### 1. Create Menu

```bash
POST /api/admin/menus
```

**Request Body:**

```json
{
  "name": "events",
  "label": "Events",
  "icon": "calendar",
  "path": "/events",
  "order": 2,
  "role": "user",
  "parent_id": null
}
```

#### 2. Create Multiple Menus (Bulk)

```bash
POST /api/admin/menus/bulk
```

**Request Body:**

```json
{
  "menus": [
    {
      "name": "dashboard",
      "label": "Dashboard",
      "icon": "layout-dashboard",
      "path": "/admin",
      "order": 1,
      "role": "admin"
    },
    {
      "name": "events",
      "label": "Events",
      "icon": "calendar",
      "path": "/admin/events",
      "order": 2,
      "role": "admin"
    }
  ]
}
```

#### 3. Update Menu

```bash
PUT /api/admin/menus/:id
```

**Request Body:**

```json
{
  "label": "Updated Label",
  "icon": "new-icon",
  "path": "/new-path",
  "order": 5,
  "is_active": true
}
```

#### 4. Delete Menu

```bash
DELETE /api/admin/menus/:id
```

## Default Menus (Auto-seeded)

### Public Menus

- **Home** - path: `/`, order: 1
- **Explore Events** - path: `/`, order: 2 (role: user)
- **My Tickets** - path: `/my-tickets`, order: 3 (role: user)

### Admin Menus

- **Dashboard** - path: `/admin`, order: 1
- **Events Management** - path: `/admin/events`, order: 2
- **Tickets Management** - path: `/admin/tickets`, order: 3
- **Transactions** - path: `/admin/transactions`, order: 4
- **Users Management** - path: `/admin/users`, order: 5
- **Menu Settings** - path: `/admin/menus`, order: 6

## Frontend Integration

### Using menus.ts Utilities

```typescript
import { fetchMenus, getUserRole, buildMenuHierarchy } from "@/lib/menus";

// Get menus for current user
const role = getUserRole(); // returns: 'public' | 'user' | 'admin'
const menus = await fetchMenus(role);
```

### Using NavbarDynamic Component

```typescript
import { NavbarDynamic } from "@/components/NavbarDynamic";

// In your root layout
export default function App() {
  return (
    <div>
      <NavbarDynamic />
      {/* Rest of your app */}
    </div>
  );
}
```

## Menu Features

### 1. Role-Based Access

- **public**: Visible to all users (not logged in)
- **user**: Visible to logged-in regular users
- **admin**: Visible only to admin users

### 2. Parent-Child Hierarchy

Menus dapat memiliki submenu melalui `parent_id`:

```json
{
  "id": 10,
  "name": "admin-section",
  "label": "Admin",
  "order": 1,
  "parent_id": null,
  "children": [
    {
      "id": 11,
      "name": "admin-users",
      "label": "Users",
      "parent_id": 10
    }
  ]
}
```

### 3. Menu Ordering

Gunakan field `order` untuk mengatur urutan tampilan menu (ascending).

### 4. Icon Support

Setiap menu dapat memiliki icon (nama dari icon library yang digunakan).

## Go Backend Code

### Models (models/models.go)

```go
type Menu struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    Name      string    `gorm:"size:100;not null;unique" json:"name"`
    Label     string    `gorm:"size:100;not null" json:"label"`
    Icon      string    `gorm:"size:100" json:"icon"`
    Path      string    `gorm:"size:255" json:"path"`
    Order     int       `gorm:"default:0" json:"order"`
    Role      string    `gorm:"size:20;default:public" json:"role"`
    IsActive  bool      `gorm:"default:true" json:"is_active"`
    ParentID  *uint     `gorm:"null" json:"parent_id"`
    Parent    *Menu     `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
    Children  []Menu    `gorm:"foreignKey:ParentID" json:"children,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

### Main Routes (main.go)

```go
// Public endpoints
menus := r.Group("/api/menus")
{
    menus.GET("", handlers.GetAllMenus)
    menus.GET("/:id", handlers.GetMenuByID)
}

// Admin endpoints
admin.POST("/menus", handlers.CreateMenu)
admin.POST("/menus/bulk", handlers.BulkCreateMenus)
admin.PUT("/menus/:id", handlers.UpdateMenu)
admin.DELETE("/menus/:id", handlers.DeleteMenu)
```

## Contoh Implementasi

### Setup Initial Menus (Backend)

```bash
curl -X POST http://localhost:8080/api/admin/menus/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "menus": [
      {
        "name": "dashboard",
        "label": "Dashboard",
        "icon": "layout-dashboard",
        "path": "/admin",
        "order": 1,
        "role": "admin"
      },
      {
        "name": "settings",
        "label": "Settings",
        "icon": "settings",
        "path": "/admin/settings",
        "order": 2,
        "role": "admin"
      }
    ]
  }'
```

### Update Menu Status (Enable/Disable)

```bash
curl -X PUT http://localhost:8080/api/admin/menus/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "is_active": false
  }'
```

### Reorder Menus

```bash
curl -X PUT http://localhost:8080/api/admin/menus/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "order": 5
  }'
```

## Tips & Best Practices

1. **Unique Names**: Pastikan setiap menu memiliki nama unik untuk identifikasi
2. **Icon Naming**: Gunakan nama icon yang konsisten dengan icon library frontend
3. **Path Consistency**: Pastikan path menu sesuai dengan routing frontend
4. **Role Management**: Selalu tentukan role yang tepat untuk visibility kontrol
5. **Caching**: Pertimbangkan caching menu results untuk performance
6. **Validation**: Validasi parent_id untuk menghindari circular references

## Troubleshooting

### Menus tidak tampil

- Cek apakah `is_active` bernilai `true`
- Verifikasi `role` sesuai dengan user role saat ini
- Cek network request di browser dev tools

### Submenu tidak muncul

- Pastikan `parent_id` merujuk ke menu yang valid
- Verifikasi parent menu juga `is_active`
- Gunakan `buildMenuHierarchy` untuk membangun struktur

### Performance Issues

- Gunakan pagination jika menus sangat banyak
- Implementasikan caching di frontend
- Gunakan query optimization di backend
