# Testing Guide

## Automated Tests

Run unit tests with:
```bash
cargo test
```

### Test Coverage

| Test | Description |
|------|-------------|
| `test_capitalize_basic` | Basic lowercase to capitalized |
| `test_capitalize_empty` | Empty string handling |
| `test_capitalize_already_capitalized` | Idempotent behavior |
| `test_capitalize_with_spaces` | Multi-word strings |
| `test_pokemon_deserialization` | Full Pokemon struct parsing |
| `test_pokemon_with_multiple_types` | Dual-type Pokemon |

## Manual Testing Checklist

### Prerequisites
1. Build the extension: `cargo build --target wasm32-wasip2`
2. Install in Zed: Command Palette > `zed: extensions` > Install Dev Extension > select project folder

### /get_pokemon Command

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid name | `/get_pokemon pikachu` | Shows Pikachu data with types, abilities, stats |
| Valid ID | `/get_pokemon 25` | Shows Pikachu data (ID 25) |
| Dual-type | `/get_pokemon charizard` | Shows Fire, Flying types |
| Hidden ability | `/get_pokemon pikachu` | Shows "Lightning Rod (Hidden)" |
| Invalid name | `/get_pokemon fakemon` | Error: Failed to fetch |
| No args | `/get_pokemon` | Error: Usage message |
| Numeric ID | `/get_pokemon 1` | Shows Bulbasaur |
| Case insensitive | `/get_pokemon PIKACHU` | Works same as lowercase |

### /move_terminal_* Commands

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Left | `/move_terminal_left` | Shows ToggleLeftDock instruction |
| Right | `/move_terminal_right` | Shows ToggleRightDock instruction |
| Bottom | `/move_terminal_bottom` | Shows ToggleBottomDock instruction |

### Edge Cases

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Pokemon with spaces | `/get_pokemon mr mime` | Should handle (may need URL encoding) |
| Very long name | `/get_pokemon aaaaaaaaaaaaaa` | Error gracefully |
| Special characters | `/get_pokemon pikachu!@#` | Error gracefully |

## Build Verification

```bash
# Check for errors without building
cargo check --target wasm32-wasip2

# Full build
cargo build --target wasm32-wasip2

# Run tests
cargo test

# Format code
cargo fmt
```

## Known Limitations

1. **No HTTP mocking**: Can't mock PokeAPI responses in tests
2. **No slash command testing**: zed_extension_api doesn't support test harness
3. **WASM-only runtime**: Extension code only runs in Zed's WASM sandbox
