package main

import (
	"fmt"
	"log"
	"ticketing-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/ticketwave_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Gagal terhubung ke database:", err)
	}

	var events []models.Event
	db.Preload("Tickets").Find(&events)

	fmt.Printf("Processing %d events...\n", len(events))

	for _, event := range events {
		if len(event.Tickets) == 0 {
			continue
		}

		// Find the minimum price for this event
		minPrice := event.Tickets[0].Price
		for _, t := range event.Tickets {
			if t.Price < minPrice {
				minPrice = t.Price
			}
		}

		fmt.Printf("Updating event '%s' (ID %d) to price %.2f for all %d tickets...\n", event.Title, event.ID, minPrice, len(event.Tickets))

		// Set all tickets for this event to the minPrice
		result := db.Model(&models.Ticket{}).Where("event_id = ?", event.ID).Update("price", minPrice)
		if result.Error != nil {
			fmt.Printf("  ❌ Error updating tickets for event %d: %v\n", event.ID, result.Error)
		} else {
			fmt.Printf("  ✅ Updated %d tickets\n", result.RowsAffected)
		}
	}

	fmt.Println("🎉 All existing ticket prices have been fixed!")
}
