#!/bin/bash

BRANCH_NAME=$1

if [ -z "$BRANCH_NAME" ]; then
    echo "Error: Please provide a branch name."
    echo "Usage: ./dev/delete-worktree.sh feat-xyz"
    exit 1
fi

REPO_NAME=$(basename "$PWD")
TARGET_DIR="../${REPO_NAME}_${BRANCH_NAME}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: No worktree found at $TARGET_DIR"
    exit 1
fi

# Bring down the docker compose stack first, while the directory (and its .env)
# still exists. Compose derives the project name from the worktree directory name,
# so running this from inside the worktree targets the right containers.
echo "Stopping docker compose services in $TARGET_DIR"
(cd "$TARGET_DIR" && docker compose down)

echo "Deleting worktree at $TARGET_DIR"
git worktree remove "$TARGET_DIR" --force
