package models

import (
	"time"
)

type User struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	FullName    string    `gorm:"size:100;not null" json:"full_name"`
	Username    string    `gorm:"size:50;uniqueIndex" json:"username"`
	Email       string    `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Password    string    `gorm:"not null" json:"-"`
	PhoneNumber string    `gorm:"size:20" json:"phone_number"`
	Address     string    `gorm:"type:text" json:"address"`
	AvatarURL   string    `gorm:"size:255" json:"avatar_url"`
	Role        string    `gorm:"size:20;default:user" json:"role"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// RELASI: Ini yang bikin kita bisa lihat riwayat tiket per user
	Transactions []Transaction `gorm:"foreignKey:UserID" json:"transactions,omitempty"`
}

// Event Model
type Event struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"size:200;not null" json:"title"`
	Artist      string    `gorm:"size:100" json:"artist"`
	Genre       string    `gorm:"size:50" json:"genre"`
	Description string    `gorm:"type:text" json:"description"`
	EventDate   time.Time `gorm:"not null" json:"event_date"`
	Location    string    `gorm:"size:200;not null" json:"location"`
	ImageURL    string    `gorm:"size:255" json:"image_url"`
	Rating      float64   `gorm:"type:decimal(3,1);default:0" json:"rating"`
	Status      string    `gorm:"size:20;default:active" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Tickets     []Ticket  `gorm:"foreignKey:EventID" json:"tickets,omitempty"`
}

// Ticket Model
type Ticket struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	EventID        uint      `gorm:"not null" json:"event_id"`
	Category       string    `gorm:"size:100;not null" json:"category"`
	Price          float64   `gorm:"type:decimal(10,2);not null" json:"price"`
	Quota          int       `gorm:"not null" json:"quota"`
	AvailableSeats int       `gorm:"not null" json:"available_seats"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Event          Event     `gorm:"foreignKey:EventID" json:"event,omitempty"`
}

// Transaction Model
type Transaction struct {
	ID         string     `gorm:"primaryKey;size:50" json:"id"`
	UserID     uint       `gorm:"not null" json:"user_id"`
	EventID    uint       `gorm:"not null" json:"event_id"`
	TicketID   uint       `gorm:"not null" json:"ticket_id"`
	Quantity   int        `gorm:"not null" json:"quantity"`
	TotalPrice float64    `gorm:"type:decimal(10,2);not null" json:"total_price"`
	Status     string     `gorm:"size:20;default:locked" json:"status"` // status default 'locked' sesuai logika seat locking
	LockUntil  *time.Time `gorm:"null" json:"lock_until,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	// RELASI: Ini bagian yang sangat krusial agar Preload() bekerja
	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Event  Event  `gorm:"foreignKey:EventID" json:"event"`   // Jangan pakai omitempty agar selalu muncul di detail tiket
	Ticket Ticket `gorm:"foreignKey:TicketID" json:"ticket"` // Jangan pakai omitempty
}

// Menu Model - Sistem menu dinamis untuk navigasi
type Menu struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100;not null;unique" json:"name"`
	Label     string    `gorm:"size:100;not null" json:"label"`
	Icon      string    `gorm:"size:100" json:"icon"`
	Path      string    `gorm:"size:255" json:"path"`
	Order     int       `gorm:"default:0" json:"order"`
	Role      string    `gorm:"size:20;default:public" json:"role"` // public, user, admin
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	ParentID  *uint     `gorm:"null" json:"parent_id"` // untuk submenu
	Parent    *Menu     `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children  []Menu    `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
