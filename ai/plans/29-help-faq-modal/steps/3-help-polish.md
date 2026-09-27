# Step 3: The owner's redesign, taken on the simulator

This step is **(specified)**. The owner read the shipped modal on the iOS simulator and ruled on its content and
its layout. Every decision below is theirs, given 2026-09-27.

## 0. Why this step exists

Steps 1 and 2 shipped what the brief asked for and the owner then read it. The verdict: the copy is too long and
too technical, it leans on the app's current name, two questions do not earn their place, and the card is
cramped. 🐋  "Again, all of this is so much text. It's just like 1 page of black text."

## 1. The owner's decisions

| # | Decision | The owner's words |
| --- | --- | --- |
| 1 | **Never name the app in user-facing copy.** It may be renamed, so every "Athan" becomes "this app" or is dropped | 🐋  "We might change the name of the app in the future, so perhaps maybe don't call it Athan everywhere... we might change it to be prayer times or Salah or something completely different" |
| 2 | **Drop "How far ahead are alerts set?"** | 🐋  "Let's remove the question how far ahead are alerts set? This is not, users don't care about that. They just know about on and off" |
| 3 | **Drop "My widget shows an old time."** A widget showing an old time is a defect to fix, not a question to answer | 🐋  "maybe we can remove that one because we shouldn't be showing an old time, actually, so let's remove that one" |
| 4 | **Far less text, far less technical.** Every answer is one or two short sentences | 🐋  "this is all very, very technical. Don't be so technical... be very compact. These are super, super long paragraphs" |
| 5 | **Guidance becomes a numbered list**, not prose | 🐋  "if you're guiding the users, like do this, then this, then this, then this. There should be a list" |
| 6 | **A dot before each question**, so a question is unmistakably a question | 🐋  "perhaps maybe put a dot before the question itself just so that people can clearly see the difference" |
| 7 | **A divider beneath the title, edge to edge**, because the answers scroll under it and the cut needs a line | 🐋  "put a divider below the title, because when I scroll, the text correctly gets cut off... but spans the entire thing, from the left to the right, edge to edge" |
| 8 | **A divider between each question** | 🐋  "Put dividers between each of the questions, some more spacing perhaps, or slight dividers" |
| 9 | **The title gets room, and an icon** | 🐋  "maybe put some padding perhaps on the help title because it is very squeezed, maybe an icon" |
| 10 | **The card uses nearly the whole screen**, about 1% inset on each side | 🐋  "use more of the screen space as well because it is quite squeezed right now... more of the screen space left and right, up and down also. Maybe like 1% off each side" |
| 11 | **Realign the Close button** | 🐋  "realign the button somehow, because it's a bit weird right now" |
| 12 | **Keep the action buttons as they are** | 🐋  "the buttons that I can see, good buttons. I like the buttons" |
| 13 | **"Focus" alone is meaningless to a user.** The switch is the "silence switch", and Focus is named only where iOS's own Settings uses that word | 🐋  "one of the questions is, is Do Not Disturb or a Focus on? What the hell is Focus?... Call it the silence switch" |
| 14 | **No subagents** | 🐋  "Please do not use any subagents" |

## 2. What changes

### 2.1 `shared/help.ts`

**`HelpTopic` and `HelpAnswer` gain one optional field:**

```ts
/** Ordered instructions, rendered as a numbered list */
steps?: string[];
```

`getHelpTopics` carries it through unchanged in shape: `{ question, text, steps, action }`.

**The eight topics, verbatim.** Two are dropped (decisions 2 and 3), leaving six shared and two Android-only.
Each question is a short cause rather than a sentence, because a list of causes is what the page is for. No
answer names the app (decision 1).

1. `question: 'Notifications are turned off'`
   - `ios`: text `'Without permission this app cannot alert you at all.'`,
     steps `['Open Settings below', 'Turn on Allow Notifications', 'Leave Sounds on']`, `action: 'appSettings'`
   - `android`: text `'Without permission this app cannot alert you at all.'`,
     steps `['Open Settings below', 'Turn notifications on', 'Leave the athan categories on']`,
     `action: 'appSettings'`
2. `question: 'Background activity is off'`
   - `ios`: text
     `'Alerts are topped up in the background. Turned off, the ones already set still play and no new ones are added.'`,
     steps `['Open Settings below', 'Turn on Background App Refresh', 'Turn off Low Power Mode']`,
     `action: 'appSettings'`
   - `android`: text
     `'Alerts are topped up in the background. Battery saving can stop that, so no new ones are added.'`,
     steps `['Open Settings below', 'Allow background activity', 'Set battery use to unrestricted']`,
     `action: 'appSettings'`
3. `question: 'The silence switch is on'`
   - `ios`: text `'It mutes notification sound before any app is asked. No app can play through it.'`,
     steps `['Flick the switch on the side of your phone', 'Or turn Silent off in Control Centre']`
   - `android`: text `'Silent mode mutes notification sound before any app is asked. No app can play through it.'`,
     steps `['Press the volume up key', 'Or turn Silent off in quick settings']`
4. `question: 'Do Not Disturb is on'`
   - `ios`: text `'It holds notifications back unless this app is allowed through.'`,
     steps `['Open Settings, then Focus', 'Pick the mode you use', 'Under Apps, add this app']`
   - `android`: text `'It silences notifications until you allow this app through.'`,
     steps `['Open the screen below', 'Allow Do Not Disturb access']`, `action: 'dndAccess'`
5. `question: 'The athan stops before it finishes'`
   - both platforms, same text, no steps:
     `'Phones play 30 seconds of a notification sound, then fall back to the default tone. Every athan is trimmed to fit.'`
6. `question: 'Nothing played after a restart'`
   - `ios`: `null`
   - `android`: text `'A restart clears every alarm, and some phones block them being set again.'`,
     steps `['Open this app once after a restart']`
7. `question: 'The athan is too quiet'`
   - `ios`: `null`
   - `android`: text `'It plays at alarm volume, not ring volume.'`,
     steps `['Raise Alarm volume in your sound settings']`
8. `question: 'Changing the athan sound'`
   - both platforms, same text, no steps: `'Open Settings, then Change athan, and pick the one you want.'`

The word "athan" stays: it names the call to prayer, which the app's own Settings already calls "Change athan".
Decision 1 is about the app's NAME, not about this word.

### 2.2 `components/modals/Modal.tsx`

Two optional props, both defaulting off, so `ModalUpdate` and `ModalWhatsNew` stay pixel for pixel identical.

- `wide?: boolean`. On: `width: '98%'`, `maxWidth: SIZE.contentMaxWidth`, `maxHeight: '96%'`, and
  `padding: SPACING.lg` in place of `SPACING.xxl`, which is what gives the answers their room (decision 10).
- `divider?: boolean`. On: renders a rule beneath the title, spanning the card edge to edge through negative
  horizontal margins equal to the card's padding (decision 7).

The title's `marginBottom` becomes `SPACING.sm` when a divider follows it, because the rule supplies the
separation the margin used to (decision 9).

### 2.3 `components/modals/Help.tsx`

- Passes `wide` and `divider` to `Modal`, and an `icon` beside the title (decision 9).
- Each question renders a dot before it (decision 6), and a divider follows every topic but the last
  (decision 8).
- `steps` render as a numbered list, `1.` `2.` `3.`, aligned so the text wraps under itself, never under the
  number (decision 5).
- `ANSWERS_HEIGHT_SHARE` rises to `0.7`, which the taller card affords.
- The Close button becomes full width inside the card rather than a fixed 160, so it sits square under the
  content instead of floating in the middle (decision 11).
- The action buttons are untouched (decision 12).

## 3. Tests

`shared/__tests__/help.test.ts` and `components/modals/__tests__/Help.test.tsx` are updated to the new content
and gain rows for what is new:

| Suite | Test | What it proves |
| --- | --- | --- |
| help | `names no app in any answer, since the app may be renamed` | Decision 1, mechanically: no topic's question, text or step contains the string `Athan` with a capital A other than inside the word `athan` |
| help | `drops the two questions the owner cut` | Decisions 2 and 3: neither `How far ahead` nor `widget` appears in any question |
| help | `guides with a list wherever it gives more than one instruction` | Decision 5: every topic with steps has at least one, and no step is empty |
| help | `keeps every answer short enough to read on a phone` | Decision 4: no `text` is longer than 160 characters |
| Help modal | `draws a dot before every question` | Decision 6 |
| Help modal | `numbers the steps it lists` | Decision 5, on screen |
| Help modal | `separates its questions with dividers` | Decision 8: the count of dividers is the count of topics, being one under the title and one after each topic but the last |

Every existing test that named a dropped question or reworded answer is updated to the new copy. No test is
deleted.

**Three suites hold that copy, not two.** `__tests__/app/index.test.tsx`'s `shows Help when the settings sheet
asks for it` asserts the first question's text, so it moves to the new wording too. This step's first commit
attempt missed it and the pre-commit hook caught it: `jest --findRelatedTests` reported
`Unable to find an element with text: Are notifications turned on for Athan?`. **A copy change reaches every
suite that quotes the copy**, so the grep that finds them is part of the step, not an afterthought:
`grep -rn '<the old string>' __tests__ components shared`.

## 4. Acceptance

```bash
npx jest shared/__tests__/help.test.ts --watchman=false --selectProjects=unit
npx jest components/modals/__tests__/Help.test.tsx components/modals/__tests__/Modal.test.tsx components/modals/__tests__/Update.test.tsx components/modals/__tests__/WhatsNew.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

The three existing modal suites must pass untouched, which is what proves `wide` and `divider` defaulting off
left the other two modals alone.

## 5. Breaks

`scripts/breaks-3.sh`, ending `ALL AS EXPECTED: 1`.

## 6. Device proof

Re-run the simulator readings from `PLAN.md` section 7 against the new layout, plus:

- **R5.** The card's own hierarchy shows a divider under the title and one between each question.
- **R6.** Every question is preceded by a dot, and every step by its number.
- **R7.** Close is full width at the foot of the card, on screen without scrolling.
