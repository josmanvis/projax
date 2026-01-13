# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Zed editor extension that fetches and displays Pokemon data from the PokeAPI. Written in Rust, compiled to WebAssembly (wasm32-wasip2).

## Build Commands

```bash
# Build the extension
cargo build --target wasm32-wasip2

# Run tests
cargo test

# Format code
cargo fmt

# Check for errors without building
cargo check --target wasm32-wasip2
```

## Installing for Development

1. Open Zed command palette (Cmd-Shift-P)
2. Select `zed: extensions`
3. Click "Install Dev Extension"
4. Select this project's root directory

The extension must be rebuilt after changes: `cargo build --target wasm32-wasip2`

## Architecture

Single-file extension (`src/lib.rs`) implementing the `zed::Extension` trait:

- **PokemonExtension** - Main extension struct registered with `zed::register_extension!`
- **Pokemon** - Serde struct for deserializing PokeAPI responses (includes types, abilities, stats)
- **PokemonTypeSlot**, **PokemonAbilitySlot**, **PokemonStat**, **NamedResource** - Supporting structs
- **capitalize()** - Helper function for formatting names
- **run_slash_command** - Handler for all slash commands, matches on command name

### Slash Commands (defined in extension.toml)

- `/get_pokemon <name_or_id>` - Fetches Pokemon data from PokeAPI via HTTP GET
- `/move_terminal_left|right|bottom` - Display dock movement instructions

### Data Flow

1. User invokes slash command in Zed
2. Extension builds HTTP request to `https://pokeapi.co/api/v2/pokemon/{query}`
3. Response deserialized to `Pokemon` struct via serde_json
4. Formatted markdown returned as `SlashCommandOutput`

## Key Files

- `src/lib.rs` - All extension logic and tests
- `extension.toml` - Zed extension manifest (slash command definitions)
- `Cargo.toml` - Rust dependencies (zed_extension_api, serde, serde_json)
- `TESTING.md` - Test documentation and manual test checklist

## Testing

Unit tests are in `src/lib.rs` under `#[cfg(test)]`:
- `test_capitalize_*` - Tests for the capitalize helper function
- `test_pokemon_*` - Tests for Pokemon struct deserialization

See `TESTING.md` for manual testing checklist.

## Issue Tracking

This project uses **beads** (`bd`) for issue tracking. See `bd ready` for available work.
