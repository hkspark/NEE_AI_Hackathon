# Static dashboard served by nginx. No build step needed — the dashboard is
# plain HTML/CSS/JS with data baked into web/data.js (generated from the CSV).
FROM nginx:1.27-alpine

# Custom config: gzip + SPA-friendly caching for static assets.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship the dashboard.
COPY web/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
