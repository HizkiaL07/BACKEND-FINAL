package handlers

import (
	"net/http"
	"strconv"
	"time"

	"ticketing-backend/database"
	"ticketing-backend/models"

	"github.com/gin-gonic/gin"
)

// ========== EVENT HANDLERS ==========

// GetAllEvents - mengambil semua event yang aktif
func GetAllEvents(c *gin.Context) {
	var events []models.Event
	isAdmin := c.Query("admin") == "true"

	query := database.DB.Preload("Tickets").Order("event_date ASC")

	if !isAdmin {
		// Jika bukan admin, hanya ambil event dengan status active dan event_date >= sekarang
		query = query.Where("status = ? AND event_date >= ?", "active", time.Now())
	}

	if result := query.Find(&events); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal mengambil data event: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Daftar event",
		Data:    events,
	})
}

// GetEventByID - mengambil detail event berdasarkan ID
func GetEventByID(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID event tidak valid",
		})
		return
	}

	var event models.Event
	if result := database.DB.Preload("Tickets").First(&event, eventID); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Event tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Detail event",
		Data:    event,
	})
}

// CreateEvent - membuat event baru (Admin only)
func CreateEvent(c *gin.Context) {
	// Cek role admin
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, Response{
			Success: false,
			Message: "Hanya admin yang dapat membuat event",
		})
		return
	}

	var input struct {
		Title       string  `json:"title" binding:"required"`
		Artist      string  `json:"artist"`
		Genre       string  `json:"genre"`
		Description string  `json:"description"`
		EventDate   string  `json:"event_date" binding:"required"`
		Location    string  `json:"location" binding:"required"`
		ImageURL    string  `json:"image_url"`
		Rating      float64 `json:"rating"`
		Price       float64 `json:"price"` // Untuk buat tiket otomatis
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	// Parse tanggal event
	var parsedDate time.Time
	var parseErr error

	// Coba beberapa format populer
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05.000Z",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	for _, f := range formats {
		parsedDate, parseErr = time.Parse(f, input.EventDate)
		if parseErr == nil {
			break
		}
	}

	if parseErr != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Format tanggal tidak valid: " + input.EventDate,
		})
		return
	}

	newEvent := models.Event{
		Title:       input.Title,
		Artist:      input.Artist,
		Genre:       input.Genre,
		Description: input.Description,
		EventDate:   parsedDate,
		Location:    input.Location,
		ImageURL:    input.ImageURL,
		Rating:      input.Rating,
		Status:      "active",
	}

	if result := database.DB.Create(&newEvent); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal membuat event: " + result.Error.Error(),
		})
		return
	}

	// Buat tiket default jika ada harga (VIP, Premium, Regular)
	if input.Price > 0 {
		categories := []struct {
			Name  string
			Mult  float64
			Quota int
		}{
			{"Regular", 1.0, 200},
			{"Premium", 1.0, 150},
			{"VIP", 1.0, 100},
		}

		for _, cat := range categories {
			ticket := models.Ticket{
				EventID:        newEvent.ID,
				Category:       cat.Name,
				Price:          input.Price * cat.Mult,
				Quota:          cat.Quota,
				AvailableSeats: cat.Quota,
			}
			database.DB.Create(&ticket)
		}
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Event berhasil dibuat",
		Data:    newEvent,
	})
}

// UpdateEvent - mengupdate event (Admin only)
func UpdateEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID event tidak valid",
		})
		return
	}

	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, Response{
			Success: false,
			Message: "Hanya admin yang dapat mengupdate event",
		})
		return
	}

	var event models.Event
	if result := database.DB.First(&event, eventID); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Event tidak ditemukan",
		})
		return
	}

	var input struct {
		Title       string  `json:"title"`
		Artist      string  `json:"artist"`
		Genre       string  `json:"genre"`
		Description string  `json:"description"`
		EventDate   string  `json:"event_date"`
		Location    string  `json:"location"`
		ImageURL    string  `json:"image_url"`
		Rating      float64 `json:"rating"`
		Status      string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	// Update field yang diisi
	if input.Title != "" {
		event.Title = input.Title
	}
	if input.Artist != "" {
		event.Artist = input.Artist
	}
	if input.Genre != "" {
		event.Genre = input.Genre
	}
	if input.Description != "" {
		event.Description = input.Description
	}
	if input.Location != "" {
		event.Location = input.Location
	}
	if input.ImageURL != "" {
		event.ImageURL = input.ImageURL
	}
	if input.Rating > 0 {
		event.Rating = input.Rating
	}
	if input.Status != "" {
		event.Status = input.Status
	}
	if input.EventDate != "" {
		parsedDate, err := time.Parse(time.RFC3339, input.EventDate)
		if err != nil {
			parsedDate, _ = time.Parse("2006-01-02 15:04:05", input.EventDate)
		}
		event.EventDate = parsedDate
	}

	if result := database.DB.Save(&event); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal mengupdate event: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Event berhasil diupdate",
		Data:    event,
	})
}

// DeleteEvent - menghapus event (Admin only)
func DeleteEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID event tidak valid",
		})
		return
	}

	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, Response{
			Success: false,
			Message: "Hanya admin yang dapat menghapus event",
		})
		return
	}

	// Hapus transaksi terkait terlebih dahulu
	if result := database.DB.Where("event_id = ?", eventID).Delete(&models.Transaction{}); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal menghapus transaksi terkait",
		})
		return
	}

	// Hapus tiket terkait terlebih dahulu untuk menghindari foreign key constraint error
	if result := database.DB.Where("event_id = ?", eventID).Delete(&models.Ticket{}); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal menghapus tiket terkait",
		})
		return
	}

	if result := database.DB.Delete(&models.Event{}, eventID); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal menghapus event",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Event berhasil dihapus",
	})
}

// UploadEventPhoto - mengupload gambar foto event
func UploadEventPhoto(c *gin.Context) {
	file, err := c.FormFile("foto")
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "File foto tidak ditemukan",
		})
		return
	}

	// Buat folder uploads jika belum ada
	filename := time.Now().Format("20060102150405") + "_" + file.Filename
	filepath := "uploads/posters/" + filename

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal menyimpan file: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Foto berhasil diupload",
		Data:    "/uploads/posters/" + filename,
	})
}

// ========== TICKET HANDLERS ==========

// GetTicketsByEvent - mengambil semua ticket untuk event tertentu
func GetTicketsByEvent(c *gin.Context) {
	// PERBAIKAN: Ubah c.Param("eventId") menjadi c.Param("id")
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID event tidak valid",
		})
		return
	}

	var tickets []models.Ticket
	if result := database.DB.Where("event_id = ?", eventID).Find(&tickets); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal mengambil data ticket",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Daftar ticket",
		Data:    tickets,
	})
}

// CreateTicket - membuat ticket untuk event (Admin only)
func CreateTicket(c *gin.Context) {
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, Response{
			Success: false,
			Message: "Hanya admin yang dapat membuat ticket",
		})
		return
	}

	var input struct {
		EventID        uint    `json:"event_id" binding:"required"`
		Category       string  `json:"category" binding:"required"`
		Price          float64 `json:"price" binding:"required"`
		Quota          int     `json:"quota" binding:"required"`
		AvailableSeats int     `json:"available_seats" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	newTicket := models.Ticket{
		EventID:        input.EventID,
		Category:       input.Category,
		Price:          input.Price,
		Quota:          input.Quota,
		AvailableSeats: input.AvailableSeats,
	}

	if result := database.DB.Create(&newTicket); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal membuat ticket: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Ticket berhasil dibuat",
		Data:    newTicket,
	})
}

// UpdateTicket - mengupdate ticket (Admin only)
func UpdateTicket(c *gin.Context) {
	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID ticket tidak valid",
		})
		return
	}

	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, Response{
			Success: false,
			Message: "Hanya admin yang dapat mengupdate ticket",
		})
		return
	}

	var ticket models.Ticket
	if result := database.DB.First(&ticket, ticketID); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Ticket tidak ditemukan",
		})
		return
	}

	var input struct {
		Category       string  `json:"category"`
		Price          float64 `json:"price"`
		Quota          int     `json:"quota"`
		AvailableSeats int     `json:"available_seats"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	if input.Category != "" {
		ticket.Category = input.Category
	}
	if input.Price > 0 {
		ticket.Price = input.Price
	}
	if input.Quota > 0 {
		ticket.Quota = input.Quota
	}
	if input.AvailableSeats > 0 {
		ticket.AvailableSeats = input.AvailableSeats
	}

	if result := database.DB.Save(&ticket); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal mengupdate ticket",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Ticket berhasil diupdate",
		Data:    ticket,
	})
}
