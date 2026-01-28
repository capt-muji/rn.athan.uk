# Quick Commands

Copy-paste these prompts for common tasks. Each is self-contained.

---

## Validate Everything

```
Run yarn validate and fix any issues.
```

## Format All Files

```
Run yarn format to format all files with Prettier.
```

## Add Tests for File

```
Read ai/AGENTS.md. Add unit tests for [FILE_PATH]. Follow patterns in shared/__tests__/_template.test.ts. Run yarn test when done.
```

## Add JSDoc to File

```
Read ai/AGENTS.md. Add JSDoc to all exports in [FILE_PATH] that are missing documentation. Follow existing JSDoc patterns.
```

## Review File for Issues

```
Read ai/AGENTS.md section 8. Review [FILE_PATH] for DRY violations, complexity issues, and pattern inconsistencies. Report findings but don't fix yet.
```

## Fix ESLint Errors

```
Run npx eslint [FILE_PATH] --fix. If errors remain, fix them manually following AGENTS.md patterns.
```

## Check Test Coverage

```
List all exports in [FOLDER] and check which have tests in __tests__/. Report: "X of Y exports have tests."
```

## Update README

```
Read ai/AGENTS.md. Review README.md against current features in the codebase. Update any outdated sections.
```

## Cleanup Imports

```
Read [FILE_PATH]. Remove unused imports, sort imports per AGENTS.md section 4, run prettier.
```

## Extract Helper Function

```
Read ai/AGENTS.md. In [FILE_PATH], extract [DESCRIBE_LOGIC] into a named helper function with JSDoc. Follow parseNightBoundaries pattern in shared/time.ts.
```

---

## Usage

Replace `[FILE_PATH]` with actual path like `shared/time.ts`.
Replace `[FOLDER]` with folder like `shared/` or `hooks/`.
Replace `[DESCRIBE_LOGIC]` with what to extract.
