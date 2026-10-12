The workers are agent files in `.opencode/agents/` (`athan-executor`, `athan-reviewer`, `athan-plan-griller`) running as subagents with enforced permissions: the executor cannot push, the reviewers cannot edit. Every step writes its state to the repository as it lands, so any session can be closed and resumed by running the command again in a fresh one. The workflow is self-contained: cloning this repository brings the commands, the skills and the workers with it.

## Development
