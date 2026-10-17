# AUDIT.md - ticket 125

The lane's audit record, in the shape scripts/check-audit.sh gates: each
dispatched pass carries its commit range and its findings file.

## Pass 1 - plan-conformance

Range: 0413248c..lane/125
Findings: /var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T//findings-plan-125.md

Verdicts pending.

## Pass 2 - blind

Range: 0413248c..lane/125
Findings: /var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T//findings-blind-125.md

Verdicts pending.

## Merge-commit resolutions in scope

The uat merge commits 5bf6756c, 751c3f41 and 3d5b0468 resolved version-file
conflicts by keeping the higher number and the lane's content; the allowlist
union kept one 2.0.940 entry.
