package store

import (
	"sneakdrop/models"
	"sync"
	"time"
)

type Engine struct {
	mu               sync.Mutex
	TotalStock       int
	AvailableStock   int
	Purchased        map[string]int
	ActiveHolds      map[string]*models.Hold
	WaitingQueue     []string
	CompletedPayment map[string]bool
}

func NewEngine() *Engine {
	return &Engine{
		TotalStock:       20,
		AvailableStock:   20,
		Purchased:        make(map[string]int),
		ActiveHolds:      make(map[string]*models.Hold),
		WaitingQueue:     make([]string, 0),
		CompletedPayment: make(map[string]bool),
	}
}

func (engine *Engine) RequestPair(userID string) (status string, position int) {
	engine.mu.Lock()
	defer engine.mu.Unlock()

	// Rule 2: Max 2 pairs total, and max 1 active hold
	if engine.Purchased[userID] >= 2 {
		return "LIMIT REACHED", 0
	}

	if _, exists := engine.ActiveHolds[userID]; exists {
		return "HELD_ALREADY!", 0
	}

	// Rule 1: Stock available, assign hold
	if engine.AvailableStock > 0 {
		engine.AvailableStock--

		hold := &models.Hold{
			UserID:    userID,
			ExpiresAt: time.Now().Add(5 * time.Minute),
		}
		engine.ActiveHolds[userID] = hold

		hold.Timer = time.AfterFunc(5*time.Minute, func() {
			engine.expireHold(userID)
		})

		return "HELD", 0
	}

	// Rule 3: No stock, join waiting line
	for i, id := range engine.WaitingQueue {
		if id == userID {
			return "QUEUED", i + 1
		}
	}

	engine.WaitingQueue = append(engine.WaitingQueue, userID)

	return "QUEUED", len(engine.WaitingQueue)
}

func (engine *Engine) expireHold(userID string) {
	engine.mu.Lock()
	defer engine.mu.Unlock()

	_, exists := engine.ActiveHolds[userID]
	if !exists {
		return
	}

	delete(engine.ActiveHolds, userID)

	//Rule 3: Auto-assign pair to the waiting line OR return it to stock
	if len(engine.WaitingQueue) > 0 {
		nextUserID := engine.WaitingQueue[0]
		engine.WaitingQueue = engine.WaitingQueue[1:]

		nextHold := &models.Hold{
			UserID:    nextUserID,
			ExpiresAt: time.Now().Add(5 * time.Minute),
		}
		engine.ActiveHolds[nextUserID] = nextHold
		nextHold.Timer = time.AfterFunc(5*time.Minute, func() {
			engine.expireHold(nextUserID)
		})
	} else {
		engine.AvailableStock++
	}
}

// SAFE PAYMENTS PROCESSING, HANDLING LATE PAYMENTS, DUPLICACY AND WRONG ORDERS
func (engine *Engine) ProcessPayments(userID string, paymentID string) string {
	engine.mu.Lock()
	defer engine.mu.Unlock()

	//Duplicacy check & fix
	if engine.CompletedPayment[paymentID] {
		return "DUPLICATE_IGNORED"
	}
	engine.CompletedPayment[paymentID] = true

	//Late payments check & fix
	hold, exists := engine.ActiveHolds[userID]
	if !exists {
		return "REFUND_REQUIRED"
	}

	//Successful Payment stops the expiration timer
	hold.Timer.Stop()

	delete(engine.ActiveHolds, userID)
	engine.Purchased[userID]++

	return "PAYMENT_SUCCESSFUL"
}

func (engine *Engine) GetStatus(userID string) models.UserStatus {
	engine.mu.Lock()
	defer engine.mu.Unlock()

	status := &models.UserStatus{
		StockLeft:      engine.AvailableStock,
		TotalPurchased: engine.Purchased[userID],
	}

	if hold, exists := engine.ActiveHolds[userID]; exists {
		status.HoldExpiresIn = int(time.Until(hold.ExpiresAt).Seconds())
	}

	for i, id := range engine.WaitingQueue {
		if id == userID {
			status.QueuePosition = i + 1
			break
		}
	}

	return *status
}
