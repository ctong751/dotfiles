#!/usr/bin/env bash
# Tmux status bar monitoring: battery, CPU, memory, Spotify
# Data cached to avoid re-running every second (refreshes every 5s)
# Spotify icon computed fresh each second

CACHE_FILE="/tmp/tmux-status-monitor"
CACHE_TTL=5

# Color and bar based on percentage (Smokies palette)
# CPU: green until 40%, gradient to red at 90%+
cpu_color() {
    local pct=$1
    if (( pct < 40 )); then
        echo "colour108"   # moss green
    elif (( pct < 55 )); then
        echo "colour144"   # khaki
    elif (( pct < 70 )); then
        echo "colour179"   # warm gold
    elif (( pct < 90 )); then
        echo "colour172"   # orange
    else
        echo "colour167"   # rust red
    fi
}

# Memory: macOS runs hot (~60-70% idle), so thresholds are higher
mem_color() {
    local pct=$1
    if (( pct < 60 )); then
        echo "colour108"   # moss green
    elif (( pct < 75 )); then
        echo "colour144"   # khaki
    elif (( pct < 85 )); then
        echo "colour179"   # warm gold
    elif (( pct < 93 )); then
        echo "colour172"   # orange
    else
        echo "colour167"   # rust red
    fi
}

level_bar() {
    local pct=$1
    local bars=(▁ ▂ ▃ ▄ ▅ ▆ ▇ █)
    local idx=$(( pct * 8 / 101 ))
    echo "${bars[$idx]}"
}

refresh_cache() {
    local parts=()

    # Battery (emoji swap at 20%, lightning bolt when charging, color gradient inverted)
    local batt_pct=""
    local charging=false
    if command -v pmset &>/dev/null; then
        local batt_info
        batt_info=$(pmset -g batt)
        batt_pct=$(echo "$batt_info" | grep -Eo '[0-9]+%' | head -1 | tr -d '%')
        echo "$batt_info" | grep -q 'AC Power' && charging=true
    elif [[ -f /sys/class/power_supply/BAT0/capacity ]]; then
        batt_pct=$(cat /sys/class/power_supply/BAT0/capacity)
        [[ "$(cat /sys/class/power_supply/BAT0/status 2>/dev/null)" == "Charging" ]] && charging=true
    fi
    if [[ -n "$batt_pct" ]]; then
        local icon="🔋"
        (( batt_pct <= 20 )) && icon="🪫"
        $charging && icon="⚡"
        # Invert percentage for color (low battery = high urgency)
        local urgency=$(( 100 - batt_pct ))
        local color=$(cpu_color "$urgency")
        parts+=("${icon} #[fg=$color]${batt_pct}%#[fg=colour188]")
    fi

    # CPU (normalized to 100% across all cores)
    if [[ "$(uname)" == "Darwin" ]]; then
        ncpu=$(sysctl -n hw.ncpu)
    else
        ncpu=$(nproc 2>/dev/null || echo 1)
    fi
    cpu_pct=$(ps -A -o %cpu | awk -v cores="$ncpu" '{s+=$1} END{printf "%.0f", s/cores}')
    if [[ -n "$cpu_pct" ]]; then
        local color=$(cpu_color "$cpu_pct")
        local bar=$(level_bar "$cpu_pct")
        parts+=("#[fg=$color]$bar cpu ${cpu_pct}%#[fg=colour188]")
    fi

    # Memory: used/total (macOS: vm_stat, Linux: free)
    if command -v vm_stat &>/dev/null; then
        total_gb=$(sysctl -n hw.memsize | awk '{printf "%.0f", $1/1073741824}')
        read -r mem_used mem_pct <<< "$(vm_stat | awk -v total="$total_gb" '
            /page size/    { ps = $8 }
            /Pages active/ { a = $3 }
            /Pages wired/  { w = $4 }
            /Pages occupied by compressor/ { c = $5 }
            END {
                used = (a + w + c) * ps / 1073741824
                printf "%.1fG/%.0fG %.0f", used, total, used * 100 / total
            }
        ')"
        if [[ -n "$mem_used" ]]; then
            local color=$(mem_color "$mem_pct")
            local bar=$(level_bar "$mem_pct")
            parts+=("#[fg=$color]$bar mem ${mem_used}#[fg=colour188]")
        fi
    elif command -v free &>/dev/null; then
        read -r mem_used mem_pct <<< "$(free -g | awk '/Mem:/{printf "%.1fG/%.0fG %.0f", $3, $2, $3*100/$2}')"
        if [[ -n "$mem_used" ]]; then
            local color=$(mem_color "$mem_pct")
            local bar=$(level_bar "$mem_pct")
            parts+=("#[fg=$color]$bar mem ${mem_used}#[fg=colour188]")
        fi
    fi

    # Spotify track info (macOS only, guard against launching the app)
    local spotify_text=""
    if [[ "$(uname)" == "Darwin" ]]; then
        spotify_text=$(osascript -e '
            if application "Spotify" is running then
                tell application "Spotify"
                    if player state is playing then
                        set a to artist of current track
                        set t to name of current track
                        return a & " – " & t
                    end if
                end tell
            end if
            return ""
        ' 2>/dev/null)
    fi

    # Join monitoring parts with bullet separator
    local sep=" #[fg=colour66]•#[fg=colour188] "
    local output=""
    for i in "${!parts[@]}"; do
        if (( i > 0 )); then
            output+="$sep"
        fi
        output+="${parts[$i]}"
    done

    # Write monitoring + spotify text (newline-separated)
    printf '%s\n%s' "$output" "$spotify_text" > "$CACHE_FILE"
}

# Refresh cache if stale
if [[ -f "$CACHE_FILE" ]]; then
    cache_age=$(( $(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || stat -f %m "$CACHE_FILE" 2>/dev/null) ))
    if (( cache_age >= CACHE_TTL )); then
        refresh_cache
    fi
else
    refresh_cache
fi

# Read cached data
monitoring=$(sed -n '1p' "$CACHE_FILE")
spotify_text=$(sed -n '2p' "$CACHE_FILE")

# Build output with Spotify
if [[ -n "$spotify_text" ]]; then
    sep=" #[fg=colour66]•#[fg=colour188] "
    echo -n "${monitoring}${sep}♫ ${spotify_text}"
else
    echo -n "$monitoring"
fi
