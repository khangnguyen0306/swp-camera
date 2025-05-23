# Sử dụng image Node.js nhẹ
FROM node:20-alpine

# Đặt thư mục làm việc
WORKDIR /app

# Copy file package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install 

# Copy toàn bộ mã nguồn vào container
COPY . .

# Thiết lập biến môi trường PORT (nếu cần)
ENV PORT=3000

# Mở cổng cho ứng dụng
EXPOSE 3000

# Lệnh chạy ứng dụng
CMD ["node", "server.js"]
