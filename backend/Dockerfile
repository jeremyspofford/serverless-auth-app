# Stage 1: Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine AS production

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S lambda -u 1001

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R lambda:nodejs /app

# Switch to non-root user
USER lambda

EXPOSE 3000

CMD ["node", "dist/index.js"]