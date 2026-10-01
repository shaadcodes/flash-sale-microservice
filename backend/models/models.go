package models

import "time"

type Hold struct {
	UserID    string
	ExpiresAt time.Time
	Timer     *time.Timer
}

type UserStatus struct {
	StockLeft      int
	HoldExpiresIn  int
	QueuePosition  int
	TotalPurchased int
}

type BuyRequest struct {
	UserID string `json:"user_id"`
}

type PaymentRequest struct {
	UserID    string `json:"user_id"`
	PaymentID string `json:"payment_id"`
}
