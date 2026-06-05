#!/bin/bash

BRANCH_NAME=$1

if [ -z "$BRANCH_NAME" ]; then
    echo "Error: Please provide a branch name."
    echo "Usage: ./dev/worktree.sh feat-xyz"
    exit 1
fi

SOURCE_BRANCH=$(git branch --show-current)
REPO_NAME=$(basename "$PWD")
TARGET_DIR="../${REPO_NAME}_${BRANCH_NAME}"

echo "Creating worktree at $TARGET_DIR from branch $SOURCE_BRANCH"
git worktree add -b "$BRANCH_NAME" "$TARGET_DIR" $SOURCE_BRANCH

if [ -d ".claude" ]; then
  echo "Copy .claude/ to worktree"
  rm -rf "$TARGET_DIR/.claude"
  cp -r ".claude" "$TARGET_DIR/.claude"
fi

cd $TARGET_DIR

echo "Create .env file"
./dev/init-env.sh

echo "npm ci"
npm ci

echo "npm run build-types"
npm run build-types

# dev-api boots the SPA middleware against ui/dist (see api/src/app.ts), so the
# UI must be built once before the API can start, even in dev (vite handles HMR after).
echo "npm -w ui run build"
npm -w ui run build

echo "-----------------------------------------------"
echo "✅ Setup Complete!"
echo "Location: $TARGET_DIR"
echo "Branch:   $BRANCH_NAME"
echo "-----------------------------------------------"
echo "Next step:"
echo "   cd $TARGET_DIR"
echo ""
