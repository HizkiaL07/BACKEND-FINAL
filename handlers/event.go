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
	
	// Ambil event dengan status active dan event_date >= sekarang
	if result := database.DB.Where("status = ? AND event_date >= ?", "active", time.Now()).
		Preload("Tickets").
		Order("event_date ASC").
		Find(&events); result.Error != nil {
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
		Description string  `json:"description"`
		EventDate   string  `json:"event_date" binding:"required"`
		Location    string  `json:"location" binding:"required"`
		ImageURL    string  `json:"image_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	// Parse tanggal event
	parsedDate, err := time.Parse("2006-01-02T15:04:05Z", input.EventDate)
	if err != nil {
		parsedDate, err = time.Parse("2006-01-02 15:04:05", input.EventDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, Response{
				Success: false,
				Message: "Format tanggal tidak valid",
			})
			return
		}
	}

	newEvent := models.Event{
		Title:       input.Title,
		Description: input.Description,
		EventDate:   parsedDate,
		Location:    input.Location,
		ImageURL:    input.ImageURL,
		Status:      "active",
	}

	if result := database.DB.Create(&newEvent); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal membuat event: " + result.Error.Error(),
		})
		return
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
		Title       string `json:"title"`
		Description string `json:"description"`
		EventDate   string `json:"event_date"`
		Location    string `json:"location"`
		ImageURL    string `json:"image_url"`
		Status      string `json:"status"`
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
	if input.Description != "" {
		event.Description = input.Description
	}
	if input.Location != "" {
		event.Location = input.Location
	}
	if input.ImageURL != "" {
		event.ImageURL = input.ImageURL
	}
	if input.Status != "" {
		event.Status = input.Status
	}
	if input.EventDate != "" {
		parsedDate, err := time.Parse("2006-01-02T15:04:05Z", input.EventDate)
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
		AvailableSeats int     `json:"available_quanseats" binding:"required"`
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