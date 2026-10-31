# ---- build ----
FROM node:22-alpine AS build
# Công cụ build native module (better-sqlite3). Không cài vips-dev để sharp dùng bản prebuilt.
RUN apk add --no-cache build-base python3
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:22-alpine AS runner
WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /opt/app ./
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
