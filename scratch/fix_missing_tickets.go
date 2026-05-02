package main

import (
	"fmt"
	"log"
	"ticketing-backend/database"
	"ticketing-backend/models"
)

func main() {
	db := database.Connect()
	database.DB = db

	var events []models.Event
	db.Find(&events)

	fmt.Printf("Found %d events\n", len(events))

	for _, event := range events {
		var count int64
		db.Model(&models.Ticket{}).Where("event_id = ?", event.ID).Count(&count)

		if count == 0 {
			fmt.Printf("Event %d (%s) has no tickets. Adding default tickets...\n", event.ID, event.Title)

			// Default prices based on some logic or fixed values
			basePrice := 500000.0

			tickets := []models.Ticket{
				{
					EventID:        event.ID,
					Category:       "VIP",
					Price:          basePrice * 2,
					Quota:          100,
					AvailableSeats: 100,
				},
				{
					EventID:        event.ID,
					Category:       "Premium",
					Price:          basePrice * 1.5,
					Quota:          150,
					AvailableSeats: 150,
				},
				{
					EventID:        event.ID,
					Category:       "Regular",
					Price:          basePrice,
					Quota:          200,
					AvailableSeats: 200,
				},
			}

			for _, t := range tickets {
				if err := db.Create(&t).Error; err != nil {
					log.Printf("Failed to create ticket for event %d: %v", event.ID, err)
				}
			}
			fmt.Printf("Added tickets for event %d\n", event.ID)
		} else {
			fmt.Printf("Event %d (%s) already has %d tickets\n", event.ID, event.Title, count)
		}
	}
}
