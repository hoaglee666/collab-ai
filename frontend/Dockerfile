# frontend/Dockerfile

# Stage 1: Build the Angular App
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy built files from Stage 1 to Nginx folder
# Note: 'frontend' below matches your angular.json project name. 
# If your folder inside dist/ is different, update this line!
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Expose port 80 (Standard Web Port)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]