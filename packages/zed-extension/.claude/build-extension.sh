#!/bin/bash
# Build script for Projax Zed extension
# Builds the extension and copies the WASM binary to the root directory

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🔨 Building Projax extension..."
cargo build --target wasm32-wasip2

echo "📦 Copying WASM binary to extension.wasm..."
cp target/wasm32-wasip2/debug/pokemon.wasm extension.wasm

echo "✅ Build complete! Extension is ready at: extension.wasm"
echo ""
echo "Next steps:"
echo "1. Open Zed"
echo "2. Command Palette (Cmd+Shift+P)"
echo "3. Select 'zed: extensions'"
echo "4. Click 'Install Dev Extension'"
echo "5. Select this project directory"
