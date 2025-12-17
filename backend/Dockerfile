FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create the uploads folder inside the container
RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "start"]