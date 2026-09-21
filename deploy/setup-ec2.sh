#!/usr/bin/env bash
# ==========================================================
# Automated Production Provisioning Script for AWS EC2 (Ubuntu)
# Configures: Swap (2GB), Node.js 20, PM2, Nginx, MySQL 8.0, 
# and Jenkins CI/CD tuned for AWS Free Tier (1GB RAM)
# ==========================================================

set -euo pipefail

CURRENT_USER=$(whoami)
echo "=========================================================="
echo " Starting Full-Stack Server Provisioning on AWS EC2       "
echo " Target User: ${CURRENT_USER}                             "
echo " Local Time: $(date)                                      "
echo "=========================================================="

# ----------------------------------------------------------
# 1. Configure 2GB Swap Space (Crucial for AWS Free Tier 1GB RAM)
# ----------------------------------------------------------
echo ""
echo "[Step 1/8] Checking and configuring Swap space..."
if [ $(swapon --show | wc -l) -le 1 ]; then
    echo "Allocating 2GB swap file to protect against Out-Of-Memory (OOM) crashes..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Persist swap across server reboots in /etc/fstab
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    # Set swappiness to 20 (conservative swap paging)
    sudo sysctl vm.swappiness=20
    echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
    echo "Swap allocated successfully:"
    free -h
else
    echo "Swap space already detected. Skipping creation."
    free -h
fi

# ----------------------------------------------------------
# 2. Update System Packages and Install Essential Tools
# ----------------------------------------------------------
echo ""
echo "[Step 2/8] Updating package lists and installing core dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl wget git ufw build-essential gnupg lsb-release ca-certificates fontconfig

# ----------------------------------------------------------
# 3. Install Node.js 20 LTS and PM2 Process Manager
# ----------------------------------------------------------
echo ""
echo "[Step 3/8] Installing Node.js 20 LTS & PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

sudo npm install -g pm2
echo "PM2 version: $(pm2 -v)"

# Configure PM2 systemd startup hook
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "${CURRENT_USER}" --hp "${HOME}" || true

# ----------------------------------------------------------
# 4. Install Java 17 & Jenkins CI/CD Controller
# ----------------------------------------------------------
echo ""
echo "[Step 4/8] Installing OpenJDK 17 and Jenkins..."
sudo apt-get install -y openjdk-17-jre

if ! command -v jenkins &> /dev/null; then
    sudo curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
    echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y jenkins
fi

# Apply JVM memory tuning to restrict Jenkins heap to 256MB on 1GB RAM instances
echo "Configuring Jenkins JVM memory boundary (-Xms128m -Xmx256m)..."
sudo mkdir -p /etc/systemd/system/jenkins.service.d
cat << 'EOF' | sudo tee /etc/systemd/system/jenkins.service.d/override.conf
[Service]
Environment="JAVA_OPTS=-Djava.awt.headless=true -Xms128m -Xmx256m -XX:+UseSerialGC"
EOF

sudo systemctl daemon-reload
sudo systemctl enable jenkins
sudo systemctl restart jenkins

# Grant jenkins user passwordless sudo for PM2 reload commands
echo "jenkins ALL=(ALL) NOPASSWD: /usr/bin/pm2, /usr/local/bin/pm2" | sudo tee /etc/sudoers.d/jenkins-pm2
sudo chmod 0440 /etc/sudoers.d/jenkins-pm2

# ----------------------------------------------------------
# 5. Install & Tune MySQL 8.0 for Low Memory Footprint
# ----------------------------------------------------------
echo ""
echo "[Step 5/8] Installing MySQL 8.0 Server..."
sudo apt-get install -y mysql-server

# Tune InnoDB buffer pool to 64MB so MySQL doesn't consume all system RAM
cat << 'EOF' | sudo tee /etc/mysql/conf.d/low-memory.cnf
[mysqld]
innodb_buffer_pool_size = 64M
innodb_log_buffer_size = 8M
max_connections = 50
key_buffer_size = 16M
table_open_cache = 400
EOF

sudo systemctl enable mysql
sudo systemctl restart mysql

# ----------------------------------------------------------
# 6. Install & Configure Nginx Reverse Proxy
# ----------------------------------------------------------
echo ""
echo "[Step 6/8] Installing Nginx Reverse Proxy..."
sudo apt-get install -y nginx

# If script is run from project directory, copy nginx.conf
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/nginx.conf" ]; then
    echo "Deploying nginx.conf to /etc/nginx/sites-available/group-chat..."
    sudo cp "${SCRIPT_DIR}/nginx.conf" /etc/nginx/sites-available/group-chat
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf /etc/nginx/sites-available/group-chat /etc/nginx/sites-enabled/group-chat
    sudo nginx -t
    sudo systemctl enable nginx
    sudo systemctl restart nginx
fi

# ----------------------------------------------------------
# 7. Configure UFW Firewall Ports
# ----------------------------------------------------------
echo ""
echo "[Step 7/8] Configuring UFW Firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Reverse Proxy to Node & Jenkins)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # Direct Jenkins Port (if not accessed via Nginx)
sudo ufw --force enable

# ----------------------------------------------------------
# 8. Final Verification & Status
# ----------------------------------------------------------
echo ""
echo "=========================================================="
echo " Provisioning Complete! System Overview:                  "
echo "=========================================================="
echo "• Node.js:  $(node -v)"
echo "• PM2:      $(pm2 -v)"
echo "• Nginx:    $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "• Jenkins:  $(jenkins --version)"
echo "• Memory:   $(free -h | grep Mem | awk '{print $3 \" used / \" $2 \" total\"}')"
echo "• Swap:     $(free -h | grep Swap | awk '{print $3 \" used / \" $2 \" total\"}')"
echo "=========================================================="
echo ""
echo "Next Steps to Launch:"
echo "1. Jenkins Initial Admin Password:"
if [ -f /var/lib/jenkins/secrets/initialAdminPassword ]; then
    echo "   sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
    echo "   (Open http://<YOUR_EC2_PUBLIC_IP>:8080 or http://<YOUR_EC2_PUBLIC_IP>/jenkins/)"
fi
echo ""
echo "2. Set up MySQL database and user:"
echo "   sudo mysql"
echo "   CREATE DATABASE group_chat_db;"
echo "   CREATE USER 'chatuser'@'localhost' IDENTIFIED BY 'your_password';"
echo "   GRANT ALL PRIVILEGES ON group_chat_db.* TO 'chatuser'@'localhost';"
echo "   FLUSH PRIVILEGES; EXIT;"
echo ""
echo "3. Clone repository and start with PM2:"
echo "   cd ~ && git clone <YOUR_GITHUB_REPO_URL>"
echo "   cd group-chat-app"
echo "   cp server/.env.example server/.env   # (Populate your credentials)"
echo "   cd server && npm install"
echo "   cd .. && pm2 start ecosystem.config.js --env production"
echo "   pm2 save"
echo ""
echo "4. Configure Jenkins Pipeline Job:"
echo "   Point Jenkins to your Git repo with the provided Jenkinsfile."
echo "=========================================================="
