# Step 01: bring the stack up, defaults only

Requirements: R1.1, R1.2, R4.1, R5.1
Weight: 1

## Goal

It's a Plan v1.5.0 runs on this machine from its own `docker-compose.yml`, with generated
secrets in an env file outside the repository tree, telemetry off, and the documented ports.

## Branch

`board/144-itsaplan`, cut from `uat` at `5b1c965d`.

## Files

Read, never changed inside the repository: `ai/prompts/itsaplan-board.md`.
Written outside the repository tree: `$HOME/athan-gitree/sessions/144/.env` and the product
checkout at `$HOME/athan-gitree/sessions/144/itsaplan`.

## Red test

None. The failing state is the absence of a running stack, proven by the two reads below
failing to answer before the step.

## Change contract

The env file holds `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`,
`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `API_URL=http://localhost:3000`,
`APP_URL=http://localhost:3001`, `VERSION=1.5.0`, `TELEMETRY_DISABLED=1` and
`DO_NOT_TRACK=1`. `docker compose pull` then `docker compose up -d` runs the seven services.
No theme, no extra project, no product setting changed.

## Green run

`docker compose ps` reports api healthy on `0.0.0.0:3000` and web healthy on `0.0.0.0:3001`,
and `curl http://localhost:3000/auth-config` answers `{"hasUsers":false,...}`.

## Break script

`scripts/break-step1.sh`: stop the stack, then read `http://localhost:3001/login` and record the
connection failure.

## Version and commit

No version bump rides this step alone. The plan folder and the queue row commit at 2.0.1093,
`docs(plans)`.

## Review

Read the compose file once for a published port beyond 3000 and 3001, and read the env file once
for a key the compose file does not name.

## Merge

`git merge --no-ff board/144-itsaplan` after the owner's verdict.

## Done when

`R1.1` and `R1.2` hold, and no file under the repository tree holds a secret.
