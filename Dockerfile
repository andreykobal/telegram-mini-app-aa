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

# Specify build arguments to pass environment variables
# These will be provided via GitHub Actions or other CI/CD pipelines
ARG REACT_APP_PINATA_TOKEN
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_CUSTON_RPC_URL
ARG REACT_APP_TRANSAK_API_KEY

# Change directory to frontend and install dependencies
WORKDIR /usr/src/app/frontend

# Copy package.json and package-lock.json for frontend
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --legacy-peer-deps

# Set environment variables in the Docker container
# This is necessary for the build step to access the environment variables
ENV REACT_APP_PINATA_TOKEN=$REACT_APP_PINATA_TOKEN
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_CUSTON_RPC_URL=$REACT_APP_CUSTON_RPC_URL
ENV REACT_APP_TRANSAK_API_KEY=$REACT_APP_TRANSAK_API_KEY

# Build the frontend, ensuring environment variables are available to React
RUN CI=false npm run build

# Change back to the root working directory
WORKDIR /usr/src/app

# Expose the port the app runs on
EXPOSE 5001

# Command to run the application
CMD ["node", "index.js"]
