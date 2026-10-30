# ==============================================================================
# Stage 1: Build the React Frontend
# ==============================================================================
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Backend + TeX Live & Poppler Runtime
# ==============================================================================
FROM python:3.13-slim-bookworm@sha256:281d39ff02e3b389401586134ff9e6572954687822a58055ec07a60ded4e0b7f AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    USER_DATA_DIR=/app/user_data \
    FRONTEND_DIST_DIR=/app/frontend/dist

WORKDIR /app

# Install system dependencies: TeX Live (XeLaTeX, TikZ, PGFPlots, CircuitikZ, Siunitx, fonts),
# Poppler utilities (pdftocairo), dvisvgm, fontconfig, and standard fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-latex-extra \
    texlive-plain-generic \
    texlive-science \
    texlive-pictures \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-lang-german \
	lmodern \
    fonts-firacode \
    fonts-freefont-ttf \
    fontconfig \
    poppler-utils \
    dvisvgm \
    ca-certificates \
    curl \
    && mkdir -p /usr/share/fonts/opentype \
    && ln -s /usr/share/texlive/texmf-dist/fonts/opentype/public /usr/share/fonts/opentype/texlive \
    && fc-cache -f -v \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend code and templates, create presets directory
COPY backend /app/backend
RUN mkdir -p /app/user_data/presets /app/user_data/custom_latex \
    && if [ -d /app/backend/latex_files/fonts ]; then \
         mkdir -p /usr/local/share/fonts/truetype/custom \
         && cp /app/backend/latex_files/fonts/*.ttf /usr/local/share/fonts/truetype/custom/ 2>/dev/null || true \
         && fc-cache -f; \
       fi

# Create non-root user for container security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

WORKDIR /app/backend

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
