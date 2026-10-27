# Stage 1: Build the Go binary
FROM golang:1.26-alpine AS builder
WORKDIR /app

# Copy dependencies first
COPY go.mod go.sum* ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build a statically linked binary for linux/amd64
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server .

# Stage 2: Create the minimal production image
FROM alpine:latest
WORKDIR /app

# Copy only the compiled binary from the builder stage
COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]