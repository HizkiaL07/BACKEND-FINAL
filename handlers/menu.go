package handlers

import (
	"net/http"
	"strconv"

	"ticketing-backend/database"
	"ticketing-backend/models"

	"github.com/gin-gonic/gin"
)

// ========== MENU HANDLERS ==========

// GetAllMenus - Mendapatkan semua menu berdasarkan role user
func GetAllMenus(c *gin.Context) {
	role := c.DefaultQuery("role", "public")
	
	var menus []models.Menu
	
	// Query menus berdasarkan role dan parent_id NULL (hanya menu utama)
	result := database.DB.Where("is_active = ? AND (role = ? OR role = ?)", true, role, "public").
		Where("parent_id IS NULL").
		Order("order ASC").
		Preload("Children", "is_active = ?", true).
		Find(&menus)
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal mengambil menu: " + result.Error.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Menu berhasil diambil",
		Data: gin.H{
			"menus": menus,
		},
	})
}

// GetMenuByID - Mendapatkan menu beserta submenu berdasarkan ID
func GetMenuByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID menu tidak valid",
		})
		return
	}
	
	var menu models.Menu
	result := database.DB.
		Preload("Children", "is_active = ?", true).
		First(&menu, id)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Menu tidak ditemukan",
		})
		return
	}
	
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Menu berhasil diambil",
		Data: gin.H{
			"menu": menu,
		},
	})
}

// CreateMenu - Membuat menu baru (Admin only)
func CreateMenu(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Label    string `json:"label" binding:"required"`
		Icon     string `json:"icon"`
		Path     string `json:"path"`
		Order    int    `json:"order"`
		Role     string `json:"role"`
		ParentID *uint  `json:"parent_id"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}
	
	if input.Role == "" {
		input.Role = "public"
	}
	
	menu := models.Menu{
		Name:     input.Name,
		Label:    input.Label,
		Icon:     input.Icon,
		Path:     input.Path,
		Order:    input.Order,
		Role:     input.Role,
		ParentID: input.ParentID,
		IsActive: true,
	}
	
	if result := database.DB.Create(&menu); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal membuat menu: " + result.Error.Error(),
		})
		return
	}
	
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Menu berhasil dibuat",
		Data: gin.H{
			"menu": menu,
		},
	})
}

// UpdateMenu - Mengupdate menu (Admin only)
func UpdateMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID menu tidak valid",
		})
		return
	}
	
	var input struct {
		Name     string `json:"name"`
		Label    string `json:"label"`
		Icon     string `json:"icon"`
		Path     string `json:"path"`
		Order    int    `json:"order"`
		Role     string `json:"role"`
		IsActive bool   `json:"is_active"`
		ParentID *uint  `json:"parent_id"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}
	
	var menu models.Menu
	if result := database.DB.First(&menu, id); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Menu tidak ditemukan",
		})
		return
	}
	
	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Label != "" {
		updates["label"] = input.Label
	}
	if input.Icon != "" {
		updates["icon"] = input.Icon
	}
	if input.Path != "" {
		updates["path"] = input.Path
	}
	updates["order"] = input.Order
	if input.Role != "" {
		updates["role"] = input.Role
	}
	updates["is_active"] = input.IsActive
	if input.ParentID != nil {
		updates["parent_id"] = input.ParentID
	}
	
	if result := database.DB.Model(&menu).Updates(updates); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal mengupdate menu: " + result.Error.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Menu berhasil diupdate",
		Data: gin.H{
			"menu": menu,
		},
	})
}

// DeleteMenu - Menghapus menu (Admin only)
func DeleteMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "ID menu tidak valid",
		})
		return
	}
	
	var menu models.Menu
	if result := database.DB.First(&menu, id); result.Error != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Menu tidak ditemukan",
		})
		return
	}
	
	// Soft delete atau hard delete
	if result := database.DB.Delete(&menu); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal menghapus menu: " + result.Error.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Menu berhasil dihapus",
	})
}

// BulkCreateMenus - Membuat multiple menu sekaligus (Admin only)
func BulkCreateMenus(c *gin.Context) {
	var input struct {
		Menus []struct {
			Name     string `json:"name" binding:"required"`
			Label    string `json:"label" binding:"required"`
			Icon     string `json:"icon"`
			Path     string `json:"path"`
			Order    int    `json:"order"`
			Role     string `json:"role"`
			ParentID *uint  `json:"parent_id"`
		} `json:"menus" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Validasi gagal: " + err.Error(),
		})
		return
	}
	
	var menus []models.Menu
	for _, m := range input.Menus {
		role := m.Role
		if role == "" {
			role = "public"
		}
		menus = append(menus, models.Menu{
			Name:     m.Name,
			Label:    m.Label,
			Icon:     m.Icon,
			Path:     m.Path,
			Order:    m.Order,
			Role:     role,
			ParentID: m.ParentID,
			IsActive: true,
		})
	}
	
	if result := database.DB.CreateInBatches(menus, 100); result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Gagal membuat menu: " + result.Error.Error(),
		})
		return
	}
	
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Menu berhasil dibuat",
		Data: gin.H{
			"count": len(menus),
			"menus": menus,
		},
	})
}
