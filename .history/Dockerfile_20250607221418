# Step 1: Base image
FROM node:18

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy all other source code
COPY . .
COPY .env .


# Step 5: Expose the port your app runs on (change if needed)
EXPOSE 5000

# Step 6: Start the app
CMD ["node", "server.js"]
