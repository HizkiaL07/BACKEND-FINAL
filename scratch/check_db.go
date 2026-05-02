package main

import (
	"fmt"
	"ticketing-backend/database"
	"ticketing-backend/models"
)

func main() {
	db := database.Connect()
	var count int64
	db.Model(&models.Ticket{}).Count(&count)
	fmt.Printf("TICKET_COUNT:%d\n", count)
	
	var eventCount int64
	db.Model(&models.Event{}).Count(&eventCount)
	fmt.Printf("EVENT_COUNT:%d\n", eventCount)
}
