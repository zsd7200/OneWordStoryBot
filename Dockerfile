# Use an official Node.js runtime as the base image
FROM node:20-alpine

WORKDIR /app
COPY ./ /app

# Install dependencies
RUN npm i

# Start the Next.js app
CMD ["npm", "start"]
