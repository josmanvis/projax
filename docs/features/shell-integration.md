# PROJAX Shell Integration

Quick reference for integrating `prx` commands into your shell.

## Recommended Setup

Add these functions to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick directory navigation
prxcd() {
  eval "$(prx cd $@)"
}

# Run script in background
prxbg() {
  prx run "$@" --background
}

# Quick stop all processes for a project
prxstop() {
  local project="$1"
  prx ps | grep "$project" | awk '{print $2}' | while read pid; do
    prx stop "$pid"
  done
}
```

## Usage Examples

After adding the functions above, you can use:

```bash
# Navigate to projects quickly
prxcd 1                    # Jump to project ID 1
prxcd projax               # Jump to project by name

# Run scripts in background
prxbg 1 dev                # Start dev server in background
prxbg projax build         # Build in background

# Stop all processes for a project
prxstop projax             # Stop all projax processes

# Combine with other commands
prxcd 1 && npm install     # Navigate and install
prxcd 2 && git pull        # Navigate and pull
```

## Advanced Integration

### Change Directory After Running Script

```bash
# Run a script and stay in the project directory
prxrun() {
  local project="$1"
  shift
  prxcd "$project" && prx run "$project" "$@"
}
```

### Open Editor After Navigation

```bash
# Navigate and open editor
prxopen() {
  prxcd "$1" && code .     # For VS Code
  # Or: prxcd "$1" && cursor .   # For Cursor
  # Or: prxcd "$1" && vim .      # For Vim
}
```

### List Projects and Copy Path

```bash
# Quick path copy (macOS)
prxpath() {
  prx pwd "$1" | pbcopy
  echo "Copied path to clipboard: $(pbpaste)"
}
```

## Aliases

Add to your shell config for even shorter commands:

```bash
alias p='prx'              # prx shorthand
alias pi='prx i'           # Interactive UI
alias pl='prx list'        # List projects
alias ps='prx ps'          # List processes (note: overrides system ps)
alias prun='prx run'       # Run script
```

Usage:
```bash
p list                     # List projects
pi                         # Launch interactive UI
prun 1 dev -b              # Run dev in background
```

## Tips

1. **Keep the native `ps` command**: If you want to keep using the system `ps` command, don't alias it. Instead use `prx ps` directly.

2. **Use project IDs over names**: Project IDs are more reliable and shorter to type.

3. **Background mode by default**: If you usually run scripts in background, use the `prxbg` function.

4. **Interactive mode**: When in doubt, just run `prx i` for the interactive terminal UI.

