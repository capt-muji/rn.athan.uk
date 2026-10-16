3. `.agents/skills/` (repo root): the official Expo and EAS skills, and this repo's own workflow
   skills (`athan-planner`, `athan-lead`). The delivery workers (`athan-lane`,
   `athan-executor`, `athan-reviewer`, `athan-plan-griller`) are agent files under `.opencode/agents/`,
   dispatched by the lead or a lane, never loaded into the main session. Load the matching skill
