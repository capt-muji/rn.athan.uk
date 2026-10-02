# What the next session covers, and why it is one session rather than three

Row 50 answered its question: all four changes earned their place, the latch is the one that fixed the
owner's complaint, and the shipped build is the best on both phones. 🐋  "The first test that we did is
absolute best for both platforms no questions asked easily the best one."

**It also found a defect in the shipped build**, in the figure-eight calibration hint, and the owner
raised the question that found it. That defect, the design decision it forces, and the upstream PRs are
what remain.

---

## The one defect row 50 found, and it is measured

**A user who obeys the figure-eight instruction gets a WORSE first reading than one who ignores it.**

| User | Gate opens at | Error of the heading the dial draws |
| --- | --- | --- |
| waves the phone as instructed | 3.7s | **11.88 degrees** |
| ignores the hint, holds still | 9.7s | **2.98 degrees** |

Measured by `scripts/probes/probe-no-wave.mjs` against the shipped gate, 300 runs per cell.

**The mechanism, and it is the gate's own blind spot.** `hasSettled` opens when the trailing window's
two halves agree within 1.5 degrees. Waving fills that window with readings whose variation comes from
the USER'S motion rather than from the sensor, and a sinusoidal wave's two halves average to nearly the
same value, so the window looks settled while the fusion is still 12 degrees from the truth. The
animation currently rewards impatience.

**What it is NOT.** The hint is not a correctness gate: the compass opens 100% of the time either way,
waved or still, in every room tested. The owner read its role correctly: 🐋  "I like the fact that we
are using it as a loading screen to load the compass behind the scenes. That's really smart."

**And the thing the wave is genuinely for is not verified at all.** Hard iron passes the gate untouched
in every case (0, 5, 15 and 27 degrees all opened at full bias), because the gate measures DRIFT and a
stable bias does not drift. The figure-eight gesture IS the standard hard-iron re-estimation and the OS
recalibrates from it, so the hint is asking for the right thing; nothing checks whether it happened or
whether it helped.

### The design question only the owner can settle

The owner has already said the animation needs design work and a session of its own:
🐋  "If we do keep it, we definitely need to make it better. But that will be in a future session."

The options, each with what row 50 measured about it:

| Option | What it costs | What row 50 says |
| --- | --- | --- |
| **Keep the hint, fix the gate so motion cannot open it** | the gate learns to tell sensor variation from user motion | **The honest fix.** It makes the wave free rather than harmful, and keeps the loading screen he likes |
| Keep the hint, require a MINIMUM time as well | a user who waves waits 9.7s like everyone else | Simple, and throws away the wave's real benefit |
| Drop the hint | a blank or spinner for 9.7s | Loses a loading screen he likes, and loses the one gesture that can cure hard iron |
| Keep it exactly as it is | nothing | Ships a first reading 4x worse for users who follow instructions |

**A planning session takes this decision with the measurements in front of him, and it is not the
executor's.**

---

## Row 51, the upstream PRs, now has its evidence

Row 51 was queued behind row 50 so its PRs could be argued from an isolation experiment. They now can:

| Candidate | Row 50's evidence | Verdict |
| --- | --- | --- |
| **iOS `headingFilter` never set** | D judged 🐋  "not very smooth at all" on the XS; 731 of 731 readings rejected stationary; 17% survive while creeping onto a line | **Strongest, go first.** One line, and it breaks every compass built on the library |
| **Android 2-degree emission gate** | B judged 🐋  "very slow very jittery" at full 50 Hz, so the gate alone is responsible; 0.83 Hz during careful alignment | **Strong**, propose as configurable rather than deleted |
| `headingAccuracy` bucketed to 0 to 3 | untouched by row 50; session 49 read 25.4 degrees where the library says "bucket 2" | Unchanged, propose as an ADDITIONAL field |
| The 5 Hz to 50 Hz rate | A judged 🐋  "accurate, but no smooth at all" | **Weaker than it looked.** Upstream's 5 Hz is defensible for a map; this is a preference, so propose as an option |

`ai/AGENTS.md` section 8's upstream rules bind every post: anonymity is absolute, so no app name, no
repo link, no device serial and no secret in any issue, PR or comment.

---

## What is now CLOSED and must not be re-investigated

Row 50 closed these with measurements. A later session that reopens one is wasting the owner's time:

| Question | Closed by | The answer |
| --- | --- | --- |
| Which of the four changes fixed the compass? | row 50, five experiments, both phones | **The latch.** The other three are polish, and each owns one quality |
| Was the 2-degree gate the accuracy hero? | arithmetic, then A, then B | **No**, refuted three ways. Its worst error is 2.38 degrees against a 20-to-30-degree complaint |
| Would 5 Hz do? Would `SENSOR_DELAY_UI`? | experiment A | **No.** Immediately distinguishable and unacceptable; 15 Hz sits nearer 5 than 50 |
| Is the iPhone's residual 1 to 2 degrees fixable? | sessions 47, 48, 49 plus D | **Not without an invented constant.** The app's geometry is already correct to 0.1 degrees, and the phone claims 25 degrees of uncertainty |
| Does the compass fail to open if the user does not wave? | `probe-no-wave.mjs` | **No, it always opens.** The defect is the opposite: waving opens it EARLY and wronger |

---

## The ordering recommendation

**The animation defect should come before row 51.** It is a defect in shipped behaviour that affects
every user who follows an instruction the app gives them, where row 51 is a contribution to other
developers. The owner may reasonably take the opposite view, since row 51's iOS PR is one line and
helps everyone building a compass on `expo-location`.

Both are small. Neither needs a device sweep: the animation work is judged on the owner's own phone in
one sitting, and row 51 is prose and a patch.
