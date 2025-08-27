#!/bin/bash

# --- Installation Script for Discord Bot Service ---

echo "🚀 Starting Discord Bot service installation..."

# Get the absolute path to the bot's directory (where this script is located)
BOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "✅ Bot directory detected as: $BOT_DIR"

# Get the current user
CURRENT_USER=$(whoami)
echo "✅ Running as user: $CURRENT_USER"

# Find the path to the pnpm executable
PNPM_PATH=$(which pnpm)
if [ -z "$PNPM_PATH" ]; then
    echo "❌ Error: pnpm not found in your PATH. Please install pnpm or ensure it is accessible."
    exit 1
fi
echo "✅ pnpm executable found at: $PNPM_PATH"

# --- Create the systemd service file content ---
SERVICE_FILE_CONTENT="[Unit]
Description=Discord Bot for HackUTA
After=network.target

[Service]
User=$CURRENT_USER
Group=$(id -g -n $CURRENT_USER)
WorkingDirectory=$BOT_DIR
EnvironmentFile=$BOT_DIR/.env
ExecStart=$PNPM_PATH start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target"

# --- Write the service file to the systemd directory ---
SERVICE_FILE_PATH="/etc/systemd/system/discord-bot.service"
echo "📝 Writing service file to $SERVICE_FILE_PATH..."

# Use a temporary file and sudo to write to the protected directory
TEMP_FILE=$(mktemp)
echo "$SERVICE_FILE_CONTENT" > "$TEMP_FILE"
sudo mv "$TEMP_FILE" "$SERVICE_FILE_PATH"
sudo chown root:root "$SERVICE_FILE_PATH"
sudo chmod 644 "$SERVICE_FILE_PATH"

echo "✅ Service file created successfully."

# --- Enable and start the service ---
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "▶️ Enabling the bot to start on boot..."
sudo systemctl enable discord-bot.service

echo "🚀 Starting the bot service now..."
sudo systemctl start discord-bot.service

echo "🎉 Installation complete!"
echo "You can check the status of your bot with the command:"
echo "sudo systemctl status discord-bot.service"
