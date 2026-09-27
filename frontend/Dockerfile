# Use a lightweight Node Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package descriptors first to leverage Docker build cache
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy frontend source code
COPY . .

# Expose Vite development server port
EXPOSE 5173

# Start Vite dev server (host & port are already set in vite.config.js)
CMD ["npm", "run", "dev"]
