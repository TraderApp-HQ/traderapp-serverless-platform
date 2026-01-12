FROM public.ecr.aws/lambda/python:3.10

# System deps for MT5
RUN yum update -y && yum install -y \
    wine \
    wget \
    unzip \
    xorg-x11-server-Xvfb \
    libXcursor \
    libXrandr \
    libXinerama \
    mesa-libGL \
    && yum clean all

# Install MT5 (minimal)
WORKDIR /opt
RUN wget https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe \
    && wine mt5setup.exe /silent \
    && rm mt5setup.exe

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 

# App code
COPY app ./app

# Lambda entrypoint
CMD ["app.main.lambda_handler"]
