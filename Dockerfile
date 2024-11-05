# Use Go as the base image to build xk6
FROM golang:1.19 AS builder

# Install xk6
RUN go install go.k6.io/xk6/cmd/xk6@latest

# Build k6 with the xk6-amqp and xk6-random extensions
RUN xk6 build --with github.com/grafana/xk6-amqp@latest --with github.com/oleiade/xk6-random@latest

# Use a minimal Alpine image for runtime
FROM alpine:3.15

# Copy the custom k6 binary from the builder stage
COPY --from=builder /go/k6 /usr/bin/k6

# Copy the script to the container
COPY script.js /script.js

# Default command
ENTRYPOINT ["k6", "run", "/script.js"]
