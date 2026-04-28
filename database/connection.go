package database

import (
	"fmt"
	"log"

	"ticketing-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Connect menghubungkan ke database MySQL
func Connect() *gorm.DB {
	// Konfigurasi koneksi XAMPP
	// Format: user:password@tcp(127.0.0.1:3306)/nama_database?charset=utf8mb4&parseTime=True&loc=Local
	dsn := "root:@tcp(127.0.0.1:3306)/ticketwave_db?charset=utf8mb4&parseTime=True&loc=Local"
	
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("❌ Gagal terhubung ke database:", err)
	}

	fmt.Println("✅ Berhasil terhubung ke database MySQL (XAMPP)")
	return DB
}

// GetDB mengembalikan instance database
func GetDB() *gorm.DB {
	return DB
}

// MigrateDatabase membuat tabel-tabel yang diperlukan
func MigrateDatabase(db *gorm.DB) error {
	return db.AutoMigrate(&models.User{}, &models.Event{}, &models.Ticket{}, &models.Transaction{})
}