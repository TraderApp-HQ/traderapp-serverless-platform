FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV WINEDEBUG=-all

# -------------------------------
# Install system dependencies
# -------------------------------
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    cabextract \
    xvfb \
    libgl1 \
    libxcursor1 \
    libxrandr2 \
    libxinerama1 \
    libxi6 \
    python3 \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------
# Install Wine
# -------------------------------
RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y \
       wine64 \
       wine32 \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------
# Setup Wine prefix
# -------------------------------
ENV WINEPREFIX=/opt/wine
RUN wineboot --init || true

# -------------------------------
# Install MetaTrader 5
# -------------------------------
RUN mkdir -p /opt/mt5
WORKDIR /opt/mt5

RUN wget https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe \
    && xvfb-run wine mt5setup.exe /silent || true \
    && rm -f mt5setup.exe

# -------------------------------
# Python app
# -------------------------------
WORKDIR /var/task

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app ./app

# -------------------------------
# Lambda entry
# -------------------------------
CMD ["python3", "-m", "app.main"]
