# Use the official Node.js 20 image as the base image
FROM node:20

# Create a directory for the app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for backend
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the entire backend codebase
COPY . .

# Change directory to frontend and install dependencies
WORKDIR /usr/src/app/frontend

# Copy package.json and package-lock.json for frontend
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --legacy-peer-deps

# Build the frontend
RUN CI=false npm run build

# Change back to the root working directory
WORKDIR /usr/src/app

# Expose the port the app runs on
EXPOSE 5001

# Command to run the application
CMD ["node", "index.js"]
