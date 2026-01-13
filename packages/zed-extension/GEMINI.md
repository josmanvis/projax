# Gemini Code Assistant Context

This file provides context to the Gemini code assistant. 

## Project Overview

This project is a Zed editor extension for viewing Pokemon.

* **Purpose:** To display Pokemon information from the PokeAPI within the Zed editor.
* **Technologies:** Rust, Zed Extension API, PokeAPI.
* **Architecture:** The extension is written in Rust and compiled to WebAssembly. It fetches data from the PokeAPI and displays it in the Zed editor.

## Building and Running

### Prerequisites

*   Rust Toolchain: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
*   Wasm Target: `rustup target add wasm32-wasip2`

### Installation

This is a Zed extension, so it's installed differently than a typical application.

1.  Open the Zed command palette (Cmd-Shift-P).
2.  Select `zed: extensions`.
3.  Click "Install Dev Extension".
4.  Select the root directory of this project.

### Running the Project

The extension will be active once installed. You can use the following slash commands from the Zed command palette (Cmd-Shift-P):

#### `/get_pokemon <pokemon_name_or_id>`
Fetches and displays information about a Pokemon. The information will be logged to Zed's output log.

#### Terminal Movement Commands
These commands provide instructions on how to manually move the terminal dock, as direct manipulation from extensions is not currently supported.

*   `/move_terminal_left`: Instructs how to move the terminal dock to the left.
*   `/move_terminal_right`: Instructs how to move the terminal dock to the right.
*   `/move_terminal_bottom`: Instructs how to move the terminal dock to the bottom.

**Example Keybindings (add to your `keymap.json`):**
To quickly trigger these commands, you can add custom keybindings. Open your `keymap.json` (Cmd-Shift-P, then search "Open Your Keymap") and add entries like these:

```json
[
  {
    "context": "Editor || Terminal",
    "bindings": {
      "cmd-alt-left": "workspace::ToggleLeftDock",
      "cmd-alt-right": "workspace::ToggleRightDock",
      "cmd-alt-down": "workspace::ToggleBottomDock"
    }
  }
]
```

### Running Tests

There are no tests yet.

## Development Conventions

### Coding Style

*   This project follows the standard Rust coding style.
*   `rustfmt` is used for formatting.

### Testing

*   There is no testing strategy yet.

### Branching and Committing

*   There is no branching strategy yet.
*   Commit messages should be clear and concise.