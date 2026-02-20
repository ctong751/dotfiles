#!/usr/bin/env bash
# Tmux status bar monitoring: battery, CPU, memory, Spotify
# Cached to avoid re-running every second (refreshes every 5s)

CACHE_FILE="/tmp/tmux-status-monitor"
CACHE_TTL=5

if [[ -f "$CACHE_FILE" ]]; then
    cache_age=$(( $(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null) ))
    if (( cache_age < CACHE_TTL )); then
        cat "$CACHE_FILE"
        exit 0
    fi
fi

parts=()

# Battery
if command -v pmset &>/dev/null; then
    batt=$(pmset -g batt | grep -Eo '[0-9]+%' | head -1)
    [[ -n "$batt" ]] && parts+=("🔋 $batt")
elif [[ -f /sys/class/power_supply/BAT0/capacity ]]; then
    batt=$(cat /sys/class/power_supply/BAT0/capacity)
    [[ -n "$batt" ]] && parts+=("🔋 ${batt}%")
fi

# CPU (normalized to 100% across all cores)
if [[ "$(uname)" == "Darwin" ]]; then
    ncpu=$(sysctl -n hw.ncpu)
else
    ncpu=$(nproc 2>/dev/null || echo 1)
fi
cpu=$(ps -A -o %cpu | awk -v cores="$ncpu" '{s+=$1} END{printf "%.0f%%", s/cores}')
[[ -n "$cpu" ]] && parts+=("cpu $cpu")

# Memory: used/total (macOS: vm_stat, Linux: free)
if command -v vm_stat &>/dev/null; then
    total_gb=$(sysctl -n hw.memsize | awk '{printf "%.0f", $1/1073741824}')
    mem=$(vm_stat | awk -v total="$total_gb" '
        /page size/    { ps = $8 }
        /Pages active/ { a = $3 }
        /Pages wired/  { w = $4 }
        /Pages occupied by compressor/ { c = $5 }
        END { printf "%.0fG/%.0fG", (a + w + c) * ps / 1073741824, total }
    ')
    [[ -n "$mem" ]] && parts+=("mem $mem")
elif command -v free &>/dev/null; then
    mem=$(free -g | awk '/Mem:/{printf "%.0fG/%.0fG", $3, $2}')
    [[ -n "$mem" ]] && parts+=("mem $mem")
fi

# Spotify (macOS only, guard against launching the app)
if [[ "$(uname)" == "Darwin" ]]; then
    playing=$(osascript -e '
        if application "Spotify" is running then
            tell application "Spotify"
                if player state is playing then
                    set a to artist of current track
                    set t to name of current track
                    return "♫ " & a & " – " & t
                end if
            end tell
        end if
        return ""
    ' 2>/dev/null)
    [[ -n "$playing" ]] && parts+=("$playing")
fi

# Join with bullet separator
sep=" #[fg=colour66]•#[fg=colour188] "
output=""
for i in "${!parts[@]}"; do
    if (( i > 0 )); then
        output+="$sep"
    fi
    output+="${parts[$i]}"
done

echo -n "$output" > "$CACHE_FILE"
cat "$CACHE_FILE"
