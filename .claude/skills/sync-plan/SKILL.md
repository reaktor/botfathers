---
name: sync-plan
description: Sync PLAN.md with GitHub issues — create missing issues, update priorities, mark done items
user_invocable: true
---

# Sync Plan with GitHub Issues

When invoked, perform the following steps:

## Step 1: Read current state
- Read `PLAN.md` to find all tasks/milestones/phases and their status (`[DONE]`, `[NOT STARTED]`, `[IN PROGRESS]`)
- Run `gh issue list --state all --limit 100 --json number,title,state` to get all existing issues

## Step 2: Check for closed issues → mark done in plan
- For each closed GitHub issue, find the matching task in PLAN.md
- If the task isn't already marked `[DONE]`, update it to `[DONE]`
- Apply ~~strikethrough~~ formatting to completed items in PLAN.md task lists
- Example: `- ~~Bullet curving — register bullets with GravitySystem.addBody()~~`

## Step 3: Create missing issues
- For each NOT STARTED or IN PROGRESS task in PLAN.md that doesn't have a matching GitHub issue:
  - Create a new issue with `gh issue create`
  - Title format: `[X] [Team N] Task title` where X is priority 1-5
  - Priority guidelines:
    - **5** = Core gameplay blocker (can't play without it)
    - **4** = Important gameplay feature
    - **3** = Integration / wiring between systems
    - **2** = Polish, visual effects, audio
    - **1** = Nice-to-have, branding, cosmetic
  - Assign team based on file ownership in PLAN.md
  - Add a description with spec details from PLAN.md

## Step 4: Report summary
- List newly created issues
- List issues marked as done
- List any orphaned issues (exist in GitHub but not in plan)

## Matching rules
- Match issues to plan items by keywords in the title (fuzzy match)
- Don't create duplicates — if an issue already covers a plan item, skip it
- When in doubt, skip rather than create a duplicate
