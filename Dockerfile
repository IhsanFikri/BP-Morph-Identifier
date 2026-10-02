# ============================================================
# Ball Python Morph Identifier — Dockerfile
# Multi-stage build: Nginx serves the static frontend
# ============================================================

FROM nginx:alpine AS production

# Label metadata
LABEL maintainer="BP Morph Identifier"
LABEL description="Ball Python Morph Identifier - AI-powered morph identification frontend"
LABEL version="1.0"

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY images/ /usr/share/nginx/html/images/

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
