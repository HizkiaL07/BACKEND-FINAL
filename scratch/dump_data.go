package main

import (
	"fmt"
	"ticketing-backend/database"
	"ticketing-backend/models"
)

func main() {
	db := database.Connect()
	var events []models.Event
	db.Preload("Tickets").Find(&events)
	fmt.Printf("Total Events: %d\n", len(events))
	for _, e := range events {
		fmt.Printf("ID: %d, Title: %s, Date: %v, Status: %s\n", e.ID, e.Title, e.EventDate, e.Status)
		fmt.Printf("  Tickets (%d):\n", len(e.Tickets))
		for _, t := range e.Tickets {
			fmt.Printf("    - ID: %d, Category: %s, Price: %v, Available: %d\n", t.ID, t.Category, t.Price, t.AvailableSeats)
		}
	}
}
