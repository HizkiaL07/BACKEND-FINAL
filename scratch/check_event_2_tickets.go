package main

import (
	"fmt"
	"ticketing-backend/database"
	"ticketing-backend/models"
)

func main() {
	db := database.Connect()
	var tickets []models.Ticket
	db.Where("event_id = ?", 2).Find(&tickets)
	fmt.Printf("Tickets for Event 2:\n")
	for _, t := range tickets {
		fmt.Printf("- ID: %d, Category: %s, Price: %f\n", t.ID, t.Category, t.Price)
	}
}
