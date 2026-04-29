package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"ticketing-backend/database"
	"ticketing-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LockDuration adalah durasi seat locking (10 menit)
var LockDuration = 10 * time.Minute

// ========== TRANSACTION HANDLERS ==========

// CreateTransaction - membuat transaksi baru dengan seat locking
func CreateTransaction(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Debugging logs added to trace issues
	log.Printf("User ID: %v", userID)

	var input struct {
		EventID  uint `json:"event_id" binding:"required"`
		TicketID uint `json:"ticket_id" binding:"required"`
		Quantity int  `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("Invalid input: %v", err)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	log.Printf("Input received: %+v", input)

	var ticket models.Ticket
	if result := database.DB.First(&ticket, input.TicketID); result.Error != nil {
		log.Printf("Ticket not found: %v", result.Error)
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Ticket tidak ditemukan",
		})
		return
	}

	log.Printf("Ticket found: %+v", ticket)

	if ticket.EventID != input.EventID {
		log.Printf("Ticket mismatch: Ticket EventID %v, Input EventID %v", ticket.EventID, input.EventID)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Ticket tidak cocok dengan event",
		})
		return
	}

	if ticket.AvailableSeats < input.Quantity {
		log.Printf("Insufficient seats: Available %v, Requested %v", ticket.AvailableSeats, input.Quantity)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: fmt.Sprintf("Kursi tidak cukup. Tersedia: %d, Diminta: %d", ticket.AvailableSeats, input.Quantity),
		})
		return
	}

	log.Printf("Seats available. Proceeding with transaction.")
	ticket.AvailableSeats -= input.Quantity
	database.DB.Save(&ticket)

	lockUntil := time.Now().Add(LockDuration)
	transaction := models.Transaction{
		ID:         uuid.New().String(),
		UserID:     userID.(uint),
		EventID:    input.EventID,
		TicketID:   input.TicketID,
		Quantity:   input.Quantity,
		TotalPrice: ticket.Price * float64(input.Quantity),
		Status:     "locked",
		LockUntil:  &lockUntil,
	}

	if result := database.DB.Create(&transaction); result.Error != nil {
		log.Printf("Transaction creation failed: %v", result.Error)
		ticket.AvailableSeats += input.Quantity
		database.DB.Save(&ticket)
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal membuat transaksi",
		})
		return
	}

	log.Printf("Transaction created successfully: %+v", transaction)

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Transaksi berhasil dibuat. Kursi dikunci selama 10 menit.",
		Data: gin.H{
			"transaction_id": transaction.ID,
			"lock_until":    lockUntil.Format("2006-01-02 15:04:05"),
			"status":        transaction.Status,
		},
	})
}

// ConfirmTransaction - mengkonfirmasi transaksi setelah payment
func ConfirmTransaction(c *gin.Context) {
	transactionID := c.Param("id")
	userID, _ := c.Get("user_id")

	var transaction models.Transaction
	if result := database.DB.Where("id = ? AND user_id = ?", transactionID, userID).First(&transaction); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{Success: false, Message: "Transaksi tidak ditemukan"})
		return
	}

	if transaction.Status != "locked" {
		c.JSON(http.StatusBadRequest, Response{Success: false, Message: "Status transaksi tidak valid"})
		return
	}

	transaction.Status = "success"
	database.DB.Save(&transaction)

	c.JSON(http.StatusOK, Response{Success: true, Message: "Transaksi berhasil dikonfirmasi"})
}

// GetUserTransactions - mengambil semua transaksi user (UNTUK HALAMAN MY TICKETS)
func GetUserTransactions(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{Success: false, Message: "Unauthorized"})
		return
	}

	var transactions []models.Transaction
	// Preload Event dan Ticket sangat penting untuk frontend
	result := database.DB.Preload("Event").Preload("Ticket").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&transactions)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Message: "Gagal ambil data"})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    transactions,
	})
}

// GetUserProfile - Melihat detail user dan tiket yang sudah dibeli
func GetUserProfile(c *gin.Context) {
    userID, _ := c.Get("user_id")

    var user models.User
    // Preload Transactions.Event agar tiket yang sudah dibeli muncul detail acaranya
    result := database.DB.Preload("Transactions.Event").Preload("Transactions.Ticket").First(&user, userID)

    if result.Error != nil {
        c.JSON(http.StatusNotFound, Response{
            Success: false,
            Message: "User tidak ditemukan",
        })
        return
    }

    c.JSON(http.StatusOK, Response{
        Success: true,
        Message: "Detail profil berhasil diambil",
        Data:    user,
    })
}

// GetTransactionByID - mengambil detail transaksi
func GetTransactionByID(c *gin.Context) {
	transactionID := c.Param("id")
	userID, _ := c.Get("user_id")

	var transaction models.Transaction
	if result := database.DB.Where("id = ? AND user_id = ?", transactionID, userID).
		Preload("Event").Preload("Ticket").First(&transaction); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{Success: false, Message: "Tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, Response{Success: true, Data: transaction})
}

// CancelTransaction - membatalkan transaksi
func CancelTransaction(c *gin.Context) {
	transactionID := c.Param("id")
	userID, _ := c.Get("user_id")

	var transaction models.Transaction
	if result := database.DB.Where("id = ? AND user_id = ?", transactionID, userID).First(&transaction); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{Success: false, Message: "Tidak ditemukan"})
		return
	}

	var ticket models.Ticket
	database.DB.First(&ticket, transaction.TicketID)
	ticket.AvailableSeats += transaction.Quantity
	database.DB.Save(&ticket)

	transaction.Status = "failed"
	database.DB.Save(&transaction)

	c.JSON(http.StatusOK, Response{Success: true, Message: "Transaksi dibatalkan"})
}

// CheckLockStatus - cek status locking kursi
func CheckLockStatus(c *gin.Context) {
	transactionID := c.Param("id")
	var transaction models.Transaction
	if result := database.DB.First(&transaction, "id = ?", transactionID); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{Success: false, Message: "Tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, Response{Success: true, Data: transaction})
}

// AdminGetAllTransactions - admin melihat semua transaksi
func AdminGetAllTransactions(c *gin.Context) {
	var transactions []models.Transaction
	database.DB.Preload("User").Preload("Event").Preload("Ticket").Find(&transactions)
	c.JSON(http.StatusOK, Response{Success: true, Data: transactions})
}