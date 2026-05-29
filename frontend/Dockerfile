FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install 2>/dev/null || true
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run dev 2>/dev/null || tail -f /dev/null"]
