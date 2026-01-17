#!/bin/bash
# ============================================================================
# KadryHR Development Environment - Custom .bashrc
# A fully functional bash configuration with colors and aliases matching
# the KadryHR repository color scheme (emerald/green theme)
# ============================================================================

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# ============================================================================
# HISTORY CONFIGURATION
# ============================================================================
HISTCONTROL=ignoreboth
HISTSIZE=10000
HISTFILESIZE=20000
shopt -s histappend

# ============================================================================
# SHELL OPTIONS
# ============================================================================
shopt -s checkwinsize      # Update window size after each command
shopt -s globstar 2>/dev/null  # Enable ** for recursive globbing
shopt -s cdspell          # Autocorrect cd typos
shopt -s dirspell 2>/dev/null  # Autocorrect directory spelling

# ============================================================================
# COLOR DEFINITIONS (Matching KadryHR Brand Colors)
# Based on the project's color scheme:
# - Brand colors: #1ea574 (primary green), #45c992 (light green), #168460 (dark green)
# - Accent colors: #10b981 (emerald), #34d399 (light emerald)
# - Surface colors: #0b1411 (dark background), #e4f2ea (light text)
# ============================================================================

# Reset
COLOR_RESET='\[\033[0m\]'

# KadryHR Brand Colors (approximated for terminal)
# Green/Emerald theme
KADRY_GREEN='\[\033[38;2;30;165;116m\]'       # #1ea574 - Primary brand
KADRY_LIGHT_GREEN='\[\033[38;2;69;201;146m\]'  # #45c992 - Light brand
KADRY_DARK_GREEN='\[\033[38;2;22;132;96m\]'    # #168460 - Dark brand
KADRY_EMERALD='\[\033[38;2;16;185;129m\]'      # #10b981 - Accent emerald
KADRY_TEAL='\[\033[38;2;52;211;153m\]'         # #34d399 - Light accent

# Supporting Colors
KADRY_WHITE='\[\033[38;2;228;242;234m\]'       # #e4f2ea - Text color
KADRY_GRAY='\[\033[38;2;148;163;184m\]'        # #94a3b8 - Muted text
KADRY_DARK='\[\033[38;2;11;20;17m\]'           # #0b1411 - Background
KADRY_YELLOW='\[\033[38;2;254;215;170m\]'      # #fed7aa - Warning
KADRY_RED='\[\033[38;2;254;202;202m\]'         # #fecaca - Error

# Bold variants
KADRY_BOLD_GREEN='\[\033[1;38;2;30;165;116m\]'
KADRY_BOLD_WHITE='\[\033[1;38;2;228;242;234m\]'

# Standard terminal colors (fallback)
BLACK='\[\033[0;30m\]'
RED='\[\033[0;31m\]'
GREEN='\[\033[0;32m\]'
YELLOW='\[\033[0;33m\]'
BLUE='\[\033[0;34m\]'
MAGENTA='\[\033[0;35m\]'
CYAN='\[\033[0;36m\]'
WHITE='\[\033[0;37m\]'
BOLD='\[\033[1m\]'

# ============================================================================
# GIT PROMPT INTEGRATION
# ============================================================================

# Function to get git branch and status
parse_git_branch() {
    local branch
    branch=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)
    if [ -n "$branch" ]; then
        local status=""
        # Check for uncommitted changes
        if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
            status="*"
        fi
        # Check for untracked files
        if [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
            status="${status}+"
        fi
        echo " ($branch$status)"
    fi
}

# Function to detect if in KadryHR project directory
in_kadryhr_project() {
    local dir="$PWD"
    while [ "$dir" != "/" ]; do
        if [ -f "$dir/deploy.sh" ] && [ -d "$dir/backend-v2" ] && [ -d "$dir/frontend-v2" ]; then
            echo "󰊖 "  # KadryHR indicator (Nerd Font icon)
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    echo ""
}

# ============================================================================
# CUSTOM PROMPT
# ============================================================================

# KadryHR themed prompt with git integration
# Format: [time] user@host:directory (git-branch) $
set_prompt() {
    local exit_code=$?
    local prompt_symbol="❯"
    
    # Change prompt symbol color based on last command status
    if [ $exit_code -eq 0 ]; then
        local symbol_color="${KADRY_EMERALD}"
    else
        local symbol_color="${KADRY_RED}"
    fi
    
    # Build the prompt
    PS1=""
    PS1+="${KADRY_GRAY}[\t]${COLOR_RESET} "                    # Time
    PS1+="${KADRY_LIGHT_GREEN}\u${COLOR_RESET}"                # Username
    PS1+="${KADRY_GRAY}@${COLOR_RESET}"                        # @
    PS1+="${KADRY_TEAL}\h${COLOR_RESET}"                       # Hostname
    PS1+="${KADRY_GRAY}:${COLOR_RESET}"                        # :
    PS1+="${KADRY_BOLD_GREEN}\w${COLOR_RESET}"                 # Working directory
    PS1+="${KADRY_YELLOW}\$(parse_git_branch)${COLOR_RESET}"   # Git branch
    PS1+="\n"                                                   # New line
    PS1+="${symbol_color}${prompt_symbol}${COLOR_RESET} "      # Prompt symbol
}

PROMPT_COMMAND=set_prompt

# ============================================================================
# KADRYHR PROJECT ALIASES
# ============================================================================

# === Project Navigation ===
alias cdkadry='cd ~/apps/kadryhr-app 2>/dev/null || cd ~/work/KadryHR 2>/dev/null || cd /home/runner/work/KadryHR/KadryHR 2>/dev/null || echo "KadryHR project not found"'
alias cdback='cdkadry && cd backend-v2'
alias cdfront='cdkadry && cd frontend-v2'
alias cdscripts='cdkadry && cd scripts'
alias cddocs='cdkadry && cd docs'

# === Backend (NestJS) Aliases ===
alias backend='cdback'
alias bdev='cdback && npm run dev'
alias bstart='cdback && npm run start'
alias bstart:dev='cdback && npm run start:dev'
alias bstart:debug='cdback && npm run start:debug'
alias bstart:prod='cdback && npm run start:prod'
alias bbuild='cdback && npm run build'
alias btest='cdback && npm run test'
alias btest:watch='cdback && npm run test:watch'
alias btest:cov='cdback && npm run test:cov'
alias btest:e2e='cdback && npm run test:e2e'
alias blint='cdback && npm run lint'
alias bformat='cdback && npm run format'

# === Backend Prisma Aliases ===
alias pmigrate='cdback && npm run prisma:migrate'
alias pgenerate='cdback && npm run prisma:generate'
alias pseed='cdback && npm run prisma:seed'
alias pstudio='cdback && npx prisma studio'
alias pdb:push='cdback && npx prisma db push'
alias pdb:pull='cdback && npx prisma db pull'
alias pmigrate:deploy='cdback && npx prisma migrate deploy'
alias pmigrate:reset='cdback && npx prisma migrate reset'
alias pformat='cdback && npx prisma format'

# === Frontend (Next.js) Aliases ===
alias frontend='cdfront'
alias fdev='cdfront && npm run dev'
alias fbuild='cdfront && npm run build'
alias fstart='cdfront && npm run start'
alias flint='cdfront && npm run lint'
alias ftype='cdfront && npm run typecheck'
alias ftest='cdfront && npm run test'
alias ftest:e2e='cdfront && npm run test:e2e'
alias fcheck='cdfront && npm run ci:check'

# === Combined Development ===
alias kdev='echo "Starting KadryHR development servers..." && (cdback && npm run dev &) && (cdfront && npm run dev &) && echo "Backend and Frontend dev servers started!"'
alias kbuild='echo "Building KadryHR..." && cdback && npm run build && cdfront && npm run build && echo "Build complete!"'
alias ktest='echo "Running all tests..." && cdback && npm run test && cdfront && npm run test && echo "All tests passed!"'
alias klint='echo "Linting KadryHR..." && cdback && npm run lint && cdfront && npm run lint && echo "Linting complete!"'

# === Deployment Aliases ===
alias kdeploy='cdkadry && ./deploy.sh'
alias krdeploy='cdkadry && ./rdeploy.sh'
alias kdeploy:prod='cdkadry && ./scripts/deploy-prod.sh'

# === PM2 Process Management ===
alias pm2back='pm2 describe kadryhr-backend-v2'
alias pm2front='pm2 describe kadryhr-frontend-v2'
alias pm2logs:back='pm2 logs kadryhr-backend-v2'
alias pm2logs:front='pm2 logs kadryhr-frontend-v2'
alias pm2restart:back='pm2 restart kadryhr-backend-v2'
alias pm2restart:front='pm2 restart kadryhr-frontend-v2'
alias pm2stop:back='pm2 stop kadryhr-backend-v2'
alias pm2stop:front='pm2 stop kadryhr-frontend-v2'
alias pm2status='pm2 status'
alias pm2monit='pm2 monit'

# ============================================================================
# GENERAL DEVELOPMENT ALIASES
# ============================================================================

# === Git Aliases ===
alias g='git'
alias gs='git status'
alias ga='git add'
alias gaa='git add .'
alias gc='git commit'
alias gcm='git commit -m'
alias gca='git commit --amend'
alias gp='git push'
alias gpl='git pull'
alias gpom='git push origin main'
alias gplom='git pull origin main'
alias gco='git checkout'
alias gcob='git checkout -b'
alias gcom='git checkout main'
alias gb='git branch'
alias gba='git branch -a'
alias gbd='git branch -d'
alias gbD='git branch -D'
alias gm='git merge'
alias gd='git diff'
alias gds='git diff --staged'
alias gl='git log --oneline -20'
alias gla='git log --oneline --all --graph -20'
alias glg='git log --graph --pretty=format:"%C(auto)%h%Creset -%C(auto)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset" --abbrev-commit'
alias gst='git stash'
alias gstp='git stash pop'
alias gsts='git stash show -p'
alias gf='git fetch'
alias gfa='git fetch --all'
alias grb='git rebase'
alias grbi='git rebase -i'
alias grs='git reset'
alias grsh='git reset --hard'
alias gcp='git cherry-pick'
alias gtag='git tag'
alias gclean='git clean -fd'

# === NPM Aliases ===
alias ni='npm install'
alias nid='npm install --save-dev'
alias nig='npm install -g'
alias nu='npm uninstall'
alias nup='npm update'
alias nr='npm run'
alias ns='npm start'
alias nt='npm test'
alias nb='npm run build'
alias nd='npm run dev'
alias nci='npm ci'
alias nci:prod='npm ci --omit=dev'
alias nls='npm list --depth=0'
alias nout='npm outdated'
alias naud='npm audit'
alias naudfix='npm audit fix'
alias ncache='npm cache clean --force'

# === Directory Navigation ===
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias .....='cd ../../../..'
alias ~='cd ~'
alias -- -='cd -'

# === File & Directory Operations ===
alias ll='ls -alF --color=auto'
alias la='ls -A --color=auto'
alias l='ls -CF --color=auto'
alias ls='ls --color=auto'
alias lh='ls -lh --color=auto'
alias lt='ls -lt --color=auto'
alias ltr='ls -ltr --color=auto'
alias mkdir='mkdir -pv'
alias cp='cp -iv'
alias mv='mv -iv'
alias rm='rm -iv'
alias rmrf='rm -rf'

# === Search & Find ===
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'
alias rg='rg --color=auto'
alias fd='find . -type f -name'
alias ff='find . -type f | grep -i'

# === System & Process ===
alias df='df -h'
alias du='du -h'
alias dus='du -sh *'
alias free='free -h'
alias top='htop 2>/dev/null || top'
alias ps='ps aux'
alias psg='ps aux | grep -v grep | grep -i'
alias ports='netstat -tulanp 2>/dev/null || ss -tulanp'
alias myip='curl -s ifconfig.me'

# === Docker Aliases (if applicable) ===
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias drm='docker rm'
alias drmi='docker rmi'
alias dprune='docker system prune -af'
alias dlogs='docker logs -f'
alias dexec='docker exec -it'

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Create directory and cd into it
mkcd() {
    mkdir -p "$1" && cd "$1"
}

# Extract any archive
extract() {
    if [ -f "$1" ]; then
        case "$1" in
            *.tar.bz2)   tar xjf "$1"    ;;
            *.tar.gz)    tar xzf "$1"    ;;
            *.bz2)       bunzip2 "$1"    ;;
            *.rar)       unrar x "$1"    ;;
            *.gz)        gunzip "$1"     ;;
            *.tar)       tar xf "$1"     ;;
            *.tbz2)      tar xjf "$1"    ;;
            *.tgz)       tar xzf "$1"    ;;
            *.zip)       unzip "$1"      ;;
            *.Z)         uncompress "$1" ;;
            *.7z)        7z x "$1"       ;;
            *)           echo "'$1' cannot be extracted via extract()" ;;
        esac
    else
        echo "'$1' is not a valid file"
    fi
}

# Quick backup of a file
backup() {
    cp "$1" "$1.bak.$(date +%Y%m%d_%H%M%S)"
}

# Find process by name and show details
psgrep() {
    ps aux | head -1
    ps aux | grep -v grep | grep -i "$1"
}

# Kill process by name
pskill() {
    ps aux | grep -v grep | grep -i "$1" | awk '{print $2}' | xargs kill -9
}

# Quick HTTP server
serve() {
    local port="${1:-8000}"
    echo "Starting HTTP server on port $port..."
    python3 -m http.server "$port" 2>/dev/null || python -m SimpleHTTPServer "$port"
}

# Show PATH in readable format
showpath() {
    echo "$PATH" | tr ':' '\n' | nl
}

# Weather (requires curl)
weather() {
    local city="${1:-}"
    curl -s "wttr.in/${city}?format=3"
}

# Git commit with message
gcmsg() {
    git commit -m "$*"
}

# Create a new git branch and push it
gnew() {
    git checkout -b "$1" && git push -u origin "$1"
}

# Update all npm packages in package.json
nupall() {
    npm update --save
    npm update --save-dev
}

# KadryHR specific: Check project status
kadry-status() {
    echo -e "\033[38;2;30;165;116m╔════════════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[38;2;30;165;116m║           \033[1m KadryHR Project Status \033[0m\033[38;2;30;165;116m                         ║\033[0m"
    echo -e "\033[38;2;30;165;116m╚════════════════════════════════════════════════════════════╝\033[0m"
    echo ""
    
    # Check if in project directory
    if [ -f "deploy.sh" ] && [ -d "backend-v2" ] && [ -d "frontend-v2" ]; then
        echo -e "\033[38;2;69;201;146m✓ In KadryHR project directory\033[0m"
    else
        echo -e "\033[38;2;254;202;202m✗ Not in KadryHR project directory\033[0m"
        return 1
    fi
    
    echo ""
    echo -e "\033[38;2;148;163;184m─── Git Status ───\033[0m"
    git status -sb 2>/dev/null || echo "Not a git repository"
    
    echo ""
    echo -e "\033[38;2;148;163;184m─── Backend Dependencies ───\033[0m"
    if [ -f "backend-v2/package.json" ]; then
        local back_deps=$(cd backend-v2 && npm list --depth=0 2>/dev/null | head -5)
        echo "$back_deps"
    fi
    
    echo ""
    echo -e "\033[38;2;148;163;184m─── Frontend Dependencies ───\033[0m"
    if [ -f "frontend-v2/package.json" ]; then
        local front_deps=$(cd frontend-v2 && npm list --depth=0 2>/dev/null | head -5)
        echo "$front_deps"
    fi
    
    echo ""
    echo -e "\033[38;2;148;163;184m─── PM2 Processes ───\033[0m"
    pm2 list 2>/dev/null | grep -E "kadryhr|Name" || echo "PM2 not running or no KadryHR processes"
}

# KadryHR specific: Quick setup for development
kadry-setup() {
    echo -e "\033[38;2;30;165;116m🚀 Setting up KadryHR development environment...\033[0m"
    
    cdkadry || return 1
    
    echo -e "\033[38;2;148;163;184m→ Installing backend dependencies...\033[0m"
    (cd backend-v2 && npm install)
    
    echo -e "\033[38;2;148;163;184m→ Installing frontend dependencies...\033[0m"
    (cd frontend-v2 && npm install)
    
    echo -e "\033[38;2;148;163;184m→ Generating Prisma client...\033[0m"
    (cd backend-v2 && npx prisma generate)
    
    echo -e "\033[38;2;69;201;146m✓ Setup complete!\033[0m"
    echo ""
    echo "Next steps:"
    echo "  - Run 'bdev' to start backend development server"
    echo "  - Run 'fdev' to start frontend development server"
    echo "  - Run 'kdev' to start both servers simultaneously"
}

# ============================================================================
# COLORED MAN PAGES
# ============================================================================
export LESS_TERMCAP_mb=$'\e[1;32m'      # Begin blinking (green)
export LESS_TERMCAP_md=$'\e[1;32m'      # Begin bold (green - brand color)
export LESS_TERMCAP_me=$'\e[0m'         # End mode
export LESS_TERMCAP_se=$'\e[0m'         # End standout mode
export LESS_TERMCAP_so=$'\e[01;44;33m'  # Begin standout mode
export LESS_TERMCAP_ue=$'\e[0m'         # End underline
export LESS_TERMCAP_us=$'\e[1;36m'      # Begin underline (cyan)

# ============================================================================
# ENVIRONMENT VARIABLES
# ============================================================================

# Editor
export EDITOR='vim'
export VISUAL='vim'

# Less configuration
export LESS='-R --ignore-case --status-column --LONG-PROMPT --HILITE-UNREAD'

# Node.js
export NODE_ENV="${NODE_ENV:-development}"

# Colorful ls
export LS_COLORS='di=1;32:ln=36:so=35:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=34;43'

# Path additions (customize as needed)
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"

# NVM (Node Version Manager) support
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# ============================================================================
# BASH COMPLETION
# ============================================================================

# Enable programmable completion features
if ! shopt -oq posix; then
    if [ -f /usr/share/bash-completion/bash_completion ]; then
        . /usr/share/bash-completion/bash_completion
    elif [ -f /etc/bash_completion ]; then
        . /etc/bash_completion
    fi
fi

# Git completion (if available)
if [ -f /usr/share/bash-completion/completions/git ]; then
    . /usr/share/bash-completion/completions/git
fi

# npm completion
if command -v npm &>/dev/null; then
    eval "$(npm completion bash 2>/dev/null)"
fi

# ============================================================================
# STARTUP MESSAGE
# ============================================================================

# Display KadryHR welcome message (only in interactive shells)
if [[ $- == *i* ]]; then
    echo -e "\033[38;2;30;165;116m"
    echo "  ╭─────────────────────────────────────────╮"
    echo "  │         Welcome to KadryHR Dev         │"
    echo "  │   HR Management System Environment     │"
    echo "  ╰─────────────────────────────────────────╯"
    echo -e "\033[0m"
    echo -e "\033[38;2;148;163;184m  Quick commands:"
    echo "    cdkadry   - Go to project root"
    echo "    bdev      - Start backend dev server"
    echo "    fdev      - Start frontend dev server"
    echo "    kdev      - Start both servers"
    echo "    kadry-status - Check project status"
    echo -e "\033[0m"
fi

# ============================================================================
# END OF .bashrc
# ============================================================================
