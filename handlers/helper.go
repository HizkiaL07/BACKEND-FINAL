package handlers

// Response - Struct standar untuk semua response API
// Didefinisikan di sini agar bisa diakses oleh auth.go, transaction.go, dll.
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}