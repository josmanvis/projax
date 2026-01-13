#!/bin/bash

# Continuous Work Loop for Zed Extension with Beads Integration
# Runs endless iterations, checking for @mentions, processing ready work, building, testing, and syncing

PROJECT_DIR="/Users/jose/Developer/projax/packages/zed-extension"
cd "$PROJECT_DIR"

echo "🔄 Starting Continuous Work Loop with Beads Integration..."
echo "Monitoring for ready work and @opus/@claude mentions"
echo "Press Ctrl+C to stop"
echo ""

iteration=0
while true; do
  iteration=$((iteration + 1))
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  echo "═════════════════════════════════════════════════════════"
  echo "ITERATION #$iteration - $timestamp"
  echo "═════════════════════════════════════════════════════════"

  # CRITICAL: Check for @opus/@claude mentions first
  echo "🔍 Checking for @opus/@claude mentions..."
  mentions_found=0

  # Check all open issues for mentions
  for issue in $(bd list --status=open --json 2>/dev/null | jq -r '.[].id' 2>/dev/null || echo ""); do
    if [ -n "$issue" ]; then
      if bd comments "$issue" 2>/dev/null | grep -i "@opus\|@claude" > /dev/null 2>&1; then
        echo "⚠️  MENTION FOUND in $issue - needs attention"
        mentions_found=$((mentions_found + 1))
      fi
    fi
  done

  if [ "$mentions_found" -gt 0 ]; then
    echo "⚠️  Found $mentions_found issues with @mentions - user may need to respond"
  else
    echo "✓ No @mentions found"
  fi
  echo ""

  # Check for ready work
  echo "📋 Checking for ready work with bd ready..."
  ready_issues=$(bd ready --json 2>/dev/null || echo "[]")
  ready_count=$(echo "$ready_issues" | jq 'length' 2>/dev/null || echo "0")

  if [ "$ready_count" -eq 0 ]; then
    echo "✅ No ready work. System stable and monitoring."
    echo "📊 Syncing Beads..."
    bd sync 2>/dev/null || true
    echo ""
    echo "⏳ Waiting 60 seconds before next check..."
    sleep 60
    continue
  fi

  echo "🎯 Found $ready_count ready issues"

  # Get first ready issue
  first_issue=$(echo "$ready_issues" | jq -r '.[0].id // empty' 2>/dev/null || echo "")

  if [ -z "$first_issue" ]; then
    echo "⚠️  Could not parse first ready issue"
    sleep 30
    continue
  fi

  echo "Working on: $first_issue"
  echo ""

  # Update status to in_progress
  bd update "$first_issue" --status=in_progress 2>/dev/null || true

  # Build
  echo "🔨 Building extension..."
  build_output=$(cargo build --target wasm32-wasip2 2>&1)
  build_result=$?

  if [ $build_result -eq 0 ]; then
    echo "✓ Build succeeded"
    build_status="✓ Build passing"
  else
    echo "✗ Build failed"
    build_status="✗ Build failed"
    echo "$build_output" | tail -10
  fi

  # Test
  echo ""
  echo "🧪 Running tests..."
  test_output=$(cargo test --lib 2>&1)
  test_result=$?
  test_count=$(echo "$test_output" | grep "test result:" | grep -o "[0-9]* passed" | grep -o "[0-9]*" || echo "0")

  if [ $test_result -eq 0 ]; then
    echo "✓ Tests passed ($test_count tests)"
    test_status="✓ Tests passing ($test_count)"
  else
    echo "✗ Tests failed"
    test_status="✗ Tests failed"
    echo "$test_output" | tail -10
  fi

  # Sync Beads and Git
  echo ""
  echo "📊 Syncing with Beads and Git..."
  bd sync 2>/dev/null || true

  # Add progress comment
  bd comments add "zed-extension-e07" --actor "Opus" "Iteration $iteration: $build_status | $test_status. Ready issues: $ready_count. Checking work queue..." 2>/dev/null || true

  echo ""
  echo "✅ Iteration #$iteration complete"
  echo "⏳ Next iteration in 30 seconds..."
  echo ""

  sleep 30
done
