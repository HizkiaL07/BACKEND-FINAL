package main

import (
	"fmt"
	"log"
	"time"

	"ticketing-backend/database"
	"ticketing-backend/handlers"
	"ticketing-backend/middleware"
	"ticketing-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// 1. Inisialisasi Database
	db := database.Connect()
	database.DB = db

	// 2. Auto Migrate - Membuat tabel jika belum ada
	err := db.AutoMigrate(&models.User{}, &models.Event{}, &models.Ticket{}, &models.Transaction{}, &models.Menu{})
	if err != nil {
		log.Fatal("❌ Gagal migrate tabel:", err)
	}
	fmt.Println("✅ Database migration berhasil")

	// 2b. Seed default menus jika belum ada
	seedDefaultMenus(db)

	// 2c. Seed default admin
	seedDefaultAdmin()

	// 3. Setup Router
	r := SetupRouter()

	// 4. Setup Static Files (Untuk akses gambar upload)
	r.Static("/uploads", "./uploads")

	// 5. Menjalankan Server
	port := ":8080"
	fmt.Printf("🚀 Server Ticketing berjalan di http://localhost%s\n", port)
	log.Fatal(r.Run(port))
}

// SetupRouter mengkonfigurasi semua route API
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Setup CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:8081", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// ========== PUBLIC ROUTES ==========

	// Health Check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"message": "Backend TicketWave Aktif & Terhubung ke DB",
		})
	})

	// Auth Routes (Public)
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.RegisterUser)
		auth.POST("/login", handlers.LoginUser)
		auth.POST("/admin/login", handlers.LoginAdmin)
	}

	// Event Routes (Public - tanpa auth)
	events := r.Group("/api/events")
	{
		events.GET("", handlers.GetAllEvents)
		events.GET("/:id", handlers.GetEventByID)
		events.GET("/:id/tickets", handlers.GetTicketsByEvent)
	}

	// Menu Routes (Public - untuk mengambil menu)
	menus := r.Group("/api/menus")
	{
		menus.GET("", handlers.GetAllMenus)
		menus.GET("/:id", handlers.GetMenuByID)
	}

	// ========== PROTECTED ROUTES (User) ==========

	user := r.Group("/api")
	user.Use(middleware.AuthMiddleware())
	{
		// User Profile
		user.GET("/profile", handlers.GetUserProfile)
		user.PUT("/profile", handlers.UpdateProfile)
		user.POST("/profile/avatar", handlers.UploadAvatar) // Upload Avatar

		// Transactions - PERBAIKAN DI SINI
		// Gunakan 'user' (bukan router) dan path cukup 'checkout'
		user.POST("/checkout", handlers.CreateTransaction)

		// Untuk My Tickets
		user.GET("/transactions/my", handlers.GetUserTransactions)

		// Untuk list transaksi umum
		user.GET("/transactions", handlers.GetUserTransactions)

		// Detail transaksi berdasarkan ID
		user.GET("/transactions/:id", handlers.GetTransactionByID)

		user.POST("/transactions/:id/confirm", handlers.ConfirmTransaction)
		user.POST("/transactions/:id/cancel", handlers.CancelTransaction)
		user.GET("/transactions/:id/status", handlers.CheckLockStatus)
	}

	// ========== ADMIN ROUTES ==========

	admin := r.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "admin" {
			c.JSON(403, gin.H{
				"success": false,
				"message": "Admin access required",
			})
			c.Abort()
			return
		}
		c.Next()
	})
	{
		// Events (Admin)
		admin.POST("/events", handlers.CreateEvent)
		admin.POST("/events/upload", handlers.UploadEventPhoto) // Upload Photo
		admin.PUT("/events/:id", handlers.UpdateEvent)
		admin.DELETE("/events/:id", handlers.DeleteEvent)

		// Tickets (Admin)
		admin.POST("/tickets", handlers.CreateTicket)
		admin.PUT("/tickets/:id", handlers.UpdateTicket)

		// Transactions (Admin)
		admin.GET("/transactions", handlers.AdminGetAllTransactions)

		// User Management (Admin)
		admin.GET("/users", handlers.AdminGetAllUsers) // Lihat semua user

		// Menu Management (Admin)
		admin.POST("/menus", handlers.CreateMenu)
		admin.POST("/menus/bulk", handlers.BulkCreateMenus)
		admin.PUT("/menus/:id", handlers.UpdateMenu)
		admin.DELETE("/menus/:id", handlers.DeleteMenu)
	}

	return r
}

// seedDefaultMenus - Membuat menu default jika belum ada
func seedDefaultMenus(db interface{}) {
	// Cek apakah menu sudah ada
	var count int64
	database.DB.Model(&models.Menu{}).Count(&count)

	if count > 0 {
		return // Menu sudah ada, skip seeding
	}

	fmt.Println("🌱 Seeding default menus...")

	defaultMenus := []models.Menu{
		// Public Menus
		{
			Name:     "home",
			Label:    "Home",
			Icon:     "home",
			Path:     "/",
			Order:    1,
			Role:     "public",
			IsActive: true,
		},
		{
			Name:     "explore",
			Label:    "Explore Events",
			Icon:     "compass",
			Path:     "/",
			Order:    2,
			Role:     "user",
			IsActive: true,
		},
		{
			Name:     "my-tickets",
			Label:    "My Tickets",
			Icon:     "ticket",
			Path:     "/my-tickets",
			Order:    3,
			Role:     "user",
			IsActive: true,
		},
		// Admin Menus
		{
			Name:     "admin-dashboard",
			Label:    "Dashboard",
			Icon:     "layout-dashboard",
			Path:     "/admin",
			Order:    1,
			Role:     "admin",
			IsActive: true,
		},
		{
			Name:     "admin-events",
			Label:    "Events Management",
			Icon:     "calendar",
			Path:     "/admin/events",
			Order:    2,
			Role:     "admin",
			IsActive: true,
		},
		{
			Name:     "admin-tickets",
			Label:    "Tickets Management",
			Icon:     "ticket-2",
			Path:     "/admin/tickets",
			Order:    3,
			Role:     "admin",
			IsActive: true,
		},
		{
			Name:     "admin-transactions",
			Label:    "Transactions",
			Icon:     "credit-card",
			Path:     "/admin/transactions",
			Order:    4,
			Role:     "admin",
			IsActive: true,
		},
		{
			Name:     "admin-users",
			Label:    "Users Management",
			Icon:     "users",
			Path:     "/admin/users",
			Order:    5,
			Role:     "admin",
			IsActive: true,
		},
		{
			Name:     "admin-menus",
			Label:    "Menu Settings",
			Icon:     "menu",
			Path:     "/admin/menus",
			Order:    6,
			Role:     "admin",
			IsActive: true,
		},
	}

	if result := database.DB.CreateInBatches(defaultMenus, 100); result.Error != nil {
		fmt.Println("❌ Gagal seed default menus:", result.Error)
		return
	}

	fmt.Printf("✅ Berhasil seed %d default menus\n", len(defaultMenus))
}

// seedDefaultEvents - Membuat event dan ticket default jika belum ada
func seedDefaultEvents(db interface{}) {
	// 1. Cek & Seed Events
	var eventCount int64
	database.DB.Model(&models.Event{}).Count(&eventCount)

	if eventCount == 0 {
		fmt.Println("🌱 Seeding default events...")
		defaultEvents := []models.Event{
			{
				Title:       "Neon Dynasty",
				Description: "Experience the futuristic beats of Kage Riku",
				EventDate:   time.Date(2026, 6, 12, 19, 0, 0, 0, time.UTC),
				Location:    "GBK Senayan, Jakarta",
				ImageURL:    "https://via.placeholder.com/400x300?text=Neon+Dynasty",
				Status:      "active",
			},
			{
				Title:       "Frozen Horizon",
				Description: "Chill vibes with Aurora Kirana's synthwave",
				EventDate:   time.Date(2026, 6, 28, 20, 0, 0, 0, time.UTC),
				Location:    "ICE BSD, Tangerang",
				ImageURL:    "https://via.placeholder.com/400x300?text=Frozen+Horizon",
				Status:      "active",
			},
			{
				Title:       "Solar Bloom",
				Description: "Indie Pop festival with Mira Sun",
				EventDate:   time.Date(2026, 7, 5, 19, 0, 0, 0, time.UTC),
				Location:    "Istora Senayan",
				ImageURL:    "https://via.placeholder.com/400x300?text=Solar+Bloom",
				Status:      "active",
			},
			{
				Title:       "Midnight Drift",
				Description: "Alternative Rock showcase featuring Reza Velvet",
				EventDate:   time.Date(2026, 7, 19, 20, 0, 0, 0, time.UTC),
				Location:    "JIExpo Kemayoran",
				ImageURL:    "https://via.placeholder.com/400x300?text=Midnight+Drift",
				Status:      "active",
			},
			{
				Title:       "Echo Garden",
				Description: "Dream Pop experience with Lila Sora",
				EventDate:   time.Date(2026, 8, 2, 19, 30, 0, 0, time.UTC),
				Location:    "Lapangan Banteng",
				ImageURL:    "https://via.placeholder.com/400x300?text=Echo+Garden",
				Status:      "active",
			},
			{
				Title:       "Voltage Nights",
				Description: "Electronic Dance Music festival with DJ Kairo",
				EventDate:   time.Date(2026, 8, 16, 21, 0, 0, 0, time.UTC),
				Location:    "Allianz Stadium",
				ImageURL:    "https://via.placeholder.com/400x300?text=Voltage+Nights",
				Status:      "active",
			},
		}

		if result := database.DB.CreateInBatches(defaultEvents, 100); result.Error != nil {
			fmt.Println("❌ Gagal seed default events:", result.Error)
		} else {
			fmt.Printf("✅ Berhasil seed %d default events\n", len(defaultEvents))
		}
	}

	// 2. Cek & Seed Tickets (Penting jika event sudah ada tapi tiket belum ada)
	var ticketCount int64
	database.DB.Model(&models.Ticket{}).Count(&ticketCount)

	if ticketCount == 0 {
		fmt.Println("🌱 Seeding missing tickets for events...")
		var events []models.Event
		database.DB.Find(&events)

		if len(events) > 0 {
			defaultTickets := []models.Ticket{}
			for _, event := range events {
				// VIP tier
				defaultTickets = append(defaultTickets, models.Ticket{
					EventID:        event.ID,
					Category:       "VIP",
					Price:          1500000,
					Quota:          100,
					AvailableSeats: 100,
				})
				// Premium tier
				defaultTickets = append(defaultTickets, models.Ticket{
					EventID:        event.ID,
					Category:       "Premium",
					Price:          700000,
					Quota:          150,
					AvailableSeats: 150,
				})
				// Regular tier
				defaultTickets = append(defaultTickets, models.Ticket{
					EventID:        event.ID,
					Category:       "Regular",
					Price:          450000,
					Quota:          200,
					AvailableSeats: 200,
				})
			}

			if result := database.DB.CreateInBatches(defaultTickets, 100); result.Error != nil {
				fmt.Println("❌ Gagal seed default tickets:", result.Error)
			} else {
				fmt.Printf("✅ Berhasil seed %d default tickets\n", len(defaultTickets))
			}
		} else {
			fmt.Println("⏭️ Tidak ada event untuk diberikan tiket.")
		}
	} else {
		fmt.Println("⏭️ Tiket sudah terisi, skip seeding tiket.")
	}
}

// seedDefaultAdmin - Membuat akun admin default jika belum ada atau reset password jika sudah ada
func seedDefaultAdmin() {
	var admin models.User
	result := database.DB.Where("email = ? AND role = ?", "pokoknyaadmin@gmail.com", "admin").First(&admin)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("❌ Gagal enkripsi password admin:", err)
		return
	}

	if result.Error == nil {
		// Admin sudah ada, pastikan passwordnya admin123
		admin.Password = string(hashedPassword)
		database.DB.Save(&admin)
		fmt.Println("✅ Password admin default (pokoknyaadmin@gmail.com) berhasil direset ke 'admin123'")
		return
	}

	fmt.Println("🌱 Seeding default admin...")

	admin = models.User{
		FullName: "Kiaa Admin",
		Username: "admin_kiaa",
		Email:    "pokoknyaadmin@gmail.com",
		Password: string(hashedPassword),
		Role:     "admin",
	}

	if result := database.DB.Create(&admin); result.Error != nil {
		fmt.Println("❌ Gagal seed default admin:", result.Error)
		return
	}

	fmt.Println("✅ Berhasil seed default admin (pokoknyaadmin@gmail.com)")
}
