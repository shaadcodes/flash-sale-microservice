package handlers

import (
	"encoding/json"
	"net/http"
	"sneakdrop/models"
	"sneakdrop/store"
)

func ServeHTML(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "index.html")
}

func HandleStatus(engine *store.Engine) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			http.Error(w, "User ID is required!", http.StatusBadRequest)
			return
		}

		status := engine.GetStatus(userID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(status)
	}
}

func HandleBuy(engine *store.Engine) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.BuyRequest

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body!", http.StatusBadRequest)
			return
		}

		status, position := engine.RequestPair(req.UserID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":   status,
			"position": position,
		})
	}
}

func HandlePayment(engine *store.Engine) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.PaymentRequest

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body!", http.StatusBadRequest)
			return
		}

		status := engine.ProcessPayments(req.UserID, req.PaymentID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(status)
	}
}
