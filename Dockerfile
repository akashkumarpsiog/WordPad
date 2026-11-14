# Use an outdated, unpinned, or end-of-life base image yes
FROM ubuntu:20.04

# Add basic metadata
LABEL maintainer="admin@example.com"
LABEL description="Intentionally insecure container for local security testing"

# Explicitly run everything as the root user (Security Risk: Full host privilege risk if container escapes)
USER root

# Hardcode sensitive secrets directly in environment variables (Security Risk: Visible via `docker inspect` and `docker history`)
ENV AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
ENV AWS_SECRET_ACCESS_KEY="EXAMPLEKEY"
ENV DB_PASSWORD="SuperSecretPassword123!"


# Create the directory required for the SSH daemon to run
RUN mkdir -p /var/run/sshd

# Set a weak, hardcoded root password (Security Risk: Easily brute-forced)
RUN echo 'root:password123' | chpasswd

# Configure SSH to allow direct root login and password authentication (Security Risk: Weakens SSH access controls)
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config


# Set the working directory
WORKDIR /root

# Expose SSH and additional unencrypted ports (Telnet and HTTP)
EXPOSE 22 23 80
