# Use Node.js 18 LTS for React/Expo
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli@latest

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose Expo default port
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start Expo development server
CMD ["npx", "expo", "start", "--tunnel"]
