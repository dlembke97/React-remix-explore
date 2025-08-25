# --- deps (dev) ---
FROM node:20-bullseye AS dev-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

# --- deps (prod) ---
FROM node:20-bullseye AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# --- build ---
FROM node:20-bullseye AS build
WORKDIR /app
COPY . .
COPY --from=dev-deps /app/node_modules ./node_modules
RUN npm run build

# --- runtime ---
FROM node:20-bullseye
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
# install python and backend dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip3 install --no-cache-dir -r backend/requirements.txt
COPY package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY backend ./backend

RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 3000 8000
CMD ["bash", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 & npm run start"]
