# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]