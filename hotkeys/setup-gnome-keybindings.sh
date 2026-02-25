#!/bin/bash
# Set up GNOME custom keybindings for Raycast-style app toggling.
# Ctrl + <num> to focus/minimize/launch apps.
# Edit the APPS array to change bindings.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FOCUS_CMD="$HOME/.config/hotkeys/focus-or-open"
KEYBINDING_PATH="/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings"

# Format: "name|wm_class|launch_command|binding"
APPS=(
    "Focus Firefox|firefox_firefox|firefox|<Control>1"
    "Focus Cursor|Cursor|cursor|<Control>2"
    "Focus Ghostty|ghostty|ghostty|<Control>3"
    "Focus Discord|discord|discord|<Control>4"
)

# Build the keybinding path array
paths=""
for i in "${!APPS[@]}"; do
    paths+="'${KEYBINDING_PATH}/custom${i}/', "
done
paths="[${paths%, }]"

gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "$paths"

for i in "${!APPS[@]}"; do
    IFS='|' read -r name wm_class launch_cmd binding <<< "${APPS[$i]}"
    schema="org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:${KEYBINDING_PATH}/custom${i}/"
    gsettings set "$schema" name "$name"
    gsettings set "$schema" command "$FOCUS_CMD $wm_class $launch_cmd"
    gsettings set "$schema" binding "$binding"
    echo "  $binding -> $name ($wm_class)"
done
