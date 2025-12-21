# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# IMPORTANT: Check if your angular.json "outputPath" matches this folder name!
# It is usually dist/frontend/browser or dist/your-app-name/browser
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# COPY THE CONFIGURATION FILE
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]