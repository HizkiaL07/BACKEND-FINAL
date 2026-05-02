package main

import (
	"fmt"
	"ticketing-backend/database"
	"ticketing-backend/models"
)

func main() {
	db := database.Connect()
	var events []models.Event
	db.Find(&events)
	fmt.Printf("Total Events: %d\n", len(events))
	for _, e := range events {
		fmt.Printf("ID: %d, Title: %s, Date: %v, Status: %s\n", e.ID, e.Title, e.EventDate, e.Status)
	}
}
