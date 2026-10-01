package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"sneakdrop/handlers"
	"sneakdrop/store"
	"time"
)

var engine = store.NewEngine()

func main() {

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := http.NewServeMux()

	router.HandleFunc("/", handlers.ServeHTML)
	router.HandleFunc("/api/buy", handlers.HandleBuy(engine))
	router.HandleFunc("/api/status", handlers.HandleStatus(engine))
	router.HandleFunc("/api/webhook/payments", handlers.HandlePayment(engine))

	address := fmt.Sprintf("0.0.0.0:%s", port)
	fmt.Printf("Sever is listening on %s", address)

	server := &http.Server{
		Addr:         address,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	err := server.ListenAndServe()
	if err != nil {
		log.Fatalf("Server failed to start! : %v\n", err)
	}
}
