FROM node:20-alpine
WORKDIR /app

# Copy package & cài
COPY package*.json ./
RUN npm install

# Copy code
COPY . .

# Expose và chạy
EXPOSE ${PORT}
CMD ["node", "server.js"]
