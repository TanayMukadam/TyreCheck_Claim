# ---------- Stage 1: Build React App ----------
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project source
COPY . .

# Build production app
RUN npm run build

# ---------- Stage 2: Nginx Serve ----------
FROM nginx:alpine

# Copy SSL certificates
COPY certs/tyre_tyrechecks_com.crt /etc/nginx/ssl/tyre_tyrechecks_com.crt
COPY certs/tyre.tyrechecks.com.key /etc/nginx/ssl/tyre.tyrechecks.com.key

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from first stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]