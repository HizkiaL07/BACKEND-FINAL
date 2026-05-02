package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"ticketing-backend/database"
	"ticketing-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWT Secret Key - Dalam production, simpan di environment variable
var jwtSecret = []byte("ticketwave_secret_key_2024")

// Catatan: type Response sudah dihapus dari sini karena
// sudah dideklarasikan di handlers/transaction.go

// ========== USER HANDLERS ==========

// RegisterUser - mendaftarkan user baru
func RegisterUser(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"` // Kita tetap terima "name" dari frontend
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	// Cek apakah email sudah terdaftar
	var existingUser models.User
	if result := database.DB.Where("email = ?", input.Email).First(&existingUser); result.Error == nil {
		c.JSON(http.StatusConflict, Response{
			Success: false,
			Message: "Email sudah terdaftar",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal mengenkripsi password",
		})
		return
	}

	// Buat user baru (Menggunakan FullName sesuai Model)
	baseUsername := strings.Split(input.Email, "@")[0]
	generatedUsername := fmt.Sprintf("%s_%d", baseUsername, time.Now().Unix())

	newUser := models.User{
		FullName: input.Name, // input.Name dipetakan ke FullName
		Username: generatedUsername,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     "user",
	}

	if result := database.DB.Create(&newUser); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal membuat user: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Registrasi berhasil",
		Data: gin.H{
			"id":    newUser.ID,
			"name":  newUser.FullName,
			"email": newUser.Email,
			"role":  newUser.Role,
		},
	})
}

// LoginUser - login user dan generate JWT token
func LoginUser(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	var user models.User
	if result := database.DB.Where("email = ?", input.Email).First(&user); result.Error != nil {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Message: "Email atau password salah",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Message: "Email atau password salah",
		})
		return
	}

	// Generate JWT Token
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"name":    user.FullName, // Menggunakan FullName
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal generate token",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Login berhasil",
		Data: gin.H{
			"token": tokenString,
			"user": gin.H{
				"id":       user.ID,
				"name":     user.FullName,
				"username": user.Username,
				"email":    user.Email,
				"role":     user.Role,
			},
		},
	})
}

// UpdateProfile - Mengubah data diri user (Nama, Email, dan Password)
func UpdateProfile(c *gin.Context) {
	// 1. Ambil userID dari token (hasil middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{Success: false, Message: "Sesi tidak valid"})
		return
	}

	// 2. Struct untuk menerima input dari Frontend
	var input struct {
		FullName    string `json:"full_name"`
		Username    string `json:"username"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		PhoneNumber string `json:"phone_number"`
		Address     string `json:"address"`
		AvatarURL   string `json:"avatar_url"`
	}

	// 3. Bind JSON
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{Success: false, Message: "Format data tidak valid"})
		return
	}

	// 4. Cari user di database
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Success: false, Message: "User tidak ditemukan"})
		return
	}

	// 5. Update Nama jika diisi
	if input.FullName != "" {
		user.FullName = input.FullName
	}

	// 6. Update Email jika diisi & cek duplikat
	if input.Email != "" && input.Email != user.Email {
		var duplicate models.User
		if err := database.DB.Where("email = ?", input.Email).First(&duplicate).Error; err == nil {
			c.JSON(http.StatusConflict, Response{Success: false, Message: "Email sudah digunakan orang lain"})
			return
		}
		user.Email = input.Email
	}

	// 6b. Update Username jika diisi & cek duplikat
	if input.Username != "" && input.Username != user.Username {
		var duplicate models.User
		if err := database.DB.Where("username = ?", input.Username).First(&duplicate).Error; err == nil {
			c.JSON(http.StatusConflict, Response{Success: false, Message: "Username sudah digunakan"})
			return
		}
		user.Username = input.Username
	}

	// 7. Update Password jika diisi (Min. 6 karakter)
	if input.Password != "" {
		if len(input.Password) < 6 {
			c.JSON(http.StatusBadRequest, Response{Success: false, Message: "Password minimal 6 karakter"})
			return
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, Response{Success: false, Message: "Gagal memproses password"})
			return
		}
		user.Password = string(hashedPassword)
	}

	// Update field tambahan
	if input.PhoneNumber != "" {
		user.PhoneNumber = input.PhoneNumber
	}
	if input.Address != "" {
		user.Address = input.Address
	}
	if input.AvatarURL != "" {
		user.AvatarURL = input.AvatarURL
	}

	// 8. Simpan semua perubahan ke database
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Message: "Gagal update database"})
		return
	}

	// 9. Response Sukses (Jangan kirim password balik ke user!)
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Profil dan keamanan berhasil diperbarui!",
		Data: gin.H{
			"id":           user.ID,
			"full_name":    user.FullName,
			"username":     user.Username,
			"email":        user.Email,
			"phone_number": user.PhoneNumber,
			"address":      user.Address,
			"avatar_url":   user.AvatarURL,
		},
	})
}

// UploadAvatar - mengupload foto profil user
func UploadAvatar(c *gin.Context) {
	userID, _ := c.Get("user_id")
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{Success: false, Message: "File avatar tidak ditemukan"})
		return
	}

	filename := strconv.FormatUint(uint64(userID.(uint)), 10) + "_" + time.Now().Format("20060102150405") + "_" + file.Filename
	filepath := "uploads/avatars/" + filename

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Message: "Gagal menyimpan file"})
		return
	}

	avatarURL := "/uploads/avatars/" + filename
	database.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", avatarURL)

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Foto profil berhasil diupdate",
		Data:    avatarURL,
	})
}

// ========== ADMIN HANDLERS ==========

// LoginAdmin - login khusus admin
func LoginAdmin(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}

	var admin models.User
	log.Printf("Admin login attempt: Email=%s", input.Email)
	if result := database.DB.Where("email = ? AND role = ?", input.Email, "admin").First(&admin); result.Error != nil {
		log.Printf("Admin login failed: User not found or not an admin. Error: %v", result.Error)
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Message: "Akses ditolak atau akun bukan admin",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(input.Password)); err != nil {
		log.Printf("Admin login failed: Password mismatch for Email=%s", input.Email)
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Message: "Email atau password salah",
		})
		return
	}
	log.Printf("Admin login successful: Email=%s", input.Email)

	claims := jwt.MapClaims{
		"user_id": admin.ID,
		"name":    admin.FullName,
		"email":   admin.Email,
		"role":    admin.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal generate token",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Login admin berhasil",
		Data: gin.H{
			"token": tokenString,
			"user": gin.H{
				"id":       admin.ID,
				"name":     admin.FullName,
				"username": admin.Username,
				"email":    admin.Email,
				"role":     admin.Role,
			},
		},
	})
}

// AdminGetAllUsers - mengambil semua user untuk admin (Admin only)
func AdminGetAllUsers(c *gin.Context) {
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, Response{Success: false, Message: "Akses ditolak"})
		return
	}

	var users []models.User
	if err := database.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Message: "Gagal mengambil data user"})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Daftar semua user",
		Data:    users,
	})
}
