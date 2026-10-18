# FINDINGS 3T

Step 2 record, R2.1 and R2.2. Vehicle line first, then one line per surface.
Instrument note: `uiautomator dump` refused both screens on Android 9
(`ERROR: could not get idle state` / `null root node returned by
UiTestAutomationBridge`, 6 retries on the sheet and 1 on the Help modal; the
countdown strip animates every second behind both). Per PLAN.md section 10's
symptom table the bounds were read with `maestro --udid <serial> hierarchy`,
the rung above pixels; two independent sheet captures (02:14 and 02:16) agree
on every bound byte for byte. Screencaps `3t-sheet.png` and `3t-help.png` sit
in `$HOME/athan-gitree/sessions/137/` for the audit's pixel read; the pixel
transcription void is recorded in LOG.md.

Build: driven `com.example.athan` versionName=2.0.908 (the production-id
FleetTest mock per BUILD.md; valid vehicle per the lead's ruling, 2.0.908 at
or past the 2.0.811 Rubik era; the atlas dock icon launches this id). Also
installed, not driven: `com.example.athan.fleettest` versionName=2.0.996 (the
sibling lane's build). Panel 1080x1920, scale 2.625, app language ar on
arrival (no switch made, none restored).

| Surface | Node label | Bounds verbatim | Height px | Nominal | Face | em @2.625 | Candidates px (hhea/typo/win/bbox) | Nearest, gap | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sheet title | الإعدادات | [743,453][986,546] | 93 | 22 | Rubik-Medium | 1.610 | 68/68/88/91 | bbox 91, +2 | no candidate within 1px |
| Sheet subtitle | اضبط تفضيلاتك | [743,561][986,619] | 58 | 14 | Rubik-Regular | 1.578 | 44/44/56/57 | bbox 57, +1 | matches Regular bbox |
| Card title | الصلاة | [96,742][986,802] | 60 | 14 | Rubik-Medium | 1.633 | 44/44/56/58 | bbox 58, +2 | no candidate within 1px |
| Help question | لماذا لا تصلني أي إشعارات؟ | [242,358][975,419] | 61 | 15 | Rubik-Medium | 1.549 | pin 23 = 60.375 unrounded, 60 rounded | pin, +1 after rounding | reads its pin within 1px |
| Help answer | بدون إذن، لا يمكن إظهار الإشعارات. | [158,457][975,510] | 53 | 13 | Rubik-Regular | 1.553 | pin 20 = 52.5 unrounded, 53 rounded | pin, +0.5 | reads its pin within 1px |

Pin ratios for the controls: question 23/15 = 1.533em, measured 1.549em
(+0.625px at scale); answer 20/13 = 1.538em, measured 1.553em (+0.5px). Both
inside the 1px tolerance, so the instrument holds.

Corroboration inside the same captures: second card title العرض
[96,1183][986,1243] and third أخرى [96,1219][986,1279] both 60px, same as the
first card title; the other two answer lines شغّل الإشعارات في إعدادات التطبيق
[158,536][938,589] and اترك فئات الأذان مشغّلة [158,600][938,653] both 53px,
same as the first.

Two surfaces match no candidate within 1 pixel: the sheet title (93px, nearest
bbox 91px, +2) and the card title (60px, nearest bbox 58px, +2). Per PLAN.md
section 10's last symptom row these are recorded raw with every candidate's px
and go to the lead for adjudication before the verdict step runs. The subtitle
matches the Regular bbox set within tolerance.
