# --- deps (dev) ---
FROM node:20-alpine AS dev-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

# --- deps (prod) ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
COPY --from=dev-deps /app/node_modules ./node_modules
RUN npm run build

# --- runtime ---
FROM node:20-alpine
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["npm", "run", "start"]
