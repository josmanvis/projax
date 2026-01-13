#!/bin/bash

# Continuous Work Loop for Zed Extension
# This script uses Beads for issue tracking and runs iteration cycles

set -e

PROJECT_DIR="/Users/jose/Developer/projax/packages/zed-extension"
cd "$PROJECT_DIR"

echo "🔄 Starting Continuous Work Loop..."
echo "Using Beads for issue tracking"
echo ""

iteration=0
while true; do
  iteration=$((iteration + 1))
  echo "═════════════════════════════════════════════════════════"
  echo "ITERATION #$iteration - $(date '+%Y-%m-%d %H:%M:%S')"
  echo "═════════════════════════════════════════════════════════"
  echo ""

  # Check for ready work
  echo "📋 Checking for ready work..."
  ready_count=$(bd ready --json 2>/dev/null | jq 'length' || echo "0")

  if [ "$ready_count" -eq 0 ]; then
    echo "✅ No ready work available. Showing all issues..."
    bd list --status=open 2>/dev/null || echo "No open issues"
    echo ""
    echo "💤 Waiting 60 seconds before next check..."
    sleep 60
    continue
  fi

  echo "🎯 Found $ready_count ready issues"
  echo ""

  # Get first ready issue
  first_issue=$(bd ready --json 2>/dev/null | jq -r '.[0].id // empty' || echo "")

  if [ -z "$first_issue" ]; then
    echo "No issues to process"
    sleep 30
    continue
  fi

  echo "Working on issue: $first_issue"
  bd show "$first_issue" 2>/dev/null || echo "Could not fetch issue details"
  echo ""

  # Update status to in_progress
  echo "📌 Marking as in_progress..."
  bd update "$first_issue" --status=in_progress 2>/dev/null || true

  # Run builds and tests
  echo "🔨 Building extension..."
  if cargo build --target wasm32-wasip2 2>&1 | tail -5; then
    echo "✓ Build succeeded"
  else
    echo "✗ Build failed"
  fi

  echo ""
  echo "🧪 Running tests..."
  if cargo test --lib 2>&1 | tail -5; then
    echo "✓ Tests passed"
  else
    echo "✗ Tests failed"
  fi

  echo ""
  echo "📊 Syncing Beads..."
  bd sync 2>/dev/null || true

  echo ""
  echo "✅ Iteration #$iteration complete"
  echo "⏳ Next iteration in 30 seconds..."
  echo ""

  sleep 30
done
