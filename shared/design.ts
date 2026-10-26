// T-374's landed design token: the one-dim system the owner picked on
// 2026-10-26 (round 10, final-05). Every visual role of the standard schedule
// reads this; the values are hand-frozen, nothing generates them.
//
// The gradient runs top-left to bottom-right; bgTail is the purple hint
// BackgroundGradients eases in over the journey's lower reaches, strongest at
// the bottom corner. dim is the ONE dim ink: every dimmed name, time, bell and
// the time-ago chip read it; label serves the prayer name above the countdown
// and the location line.
export const DESIGN = {
  bgStart: '#05134a',
  bgEnd: '#36208a',
  bgTail: '#7117c9',
  dim: '#485396',
  label: '#4060ae',
  bright: '#f2f5f9',
  pill: '#2439f5',
  pillExtras: '#8d0ca0',
  pillShadow: '#111d89',
  pillShadowExtras: '#570962',
  settingsShadow: '#27035c',
  dot: '#db98dc',
  iconSettings: 'rgba(188, 176, 221, 0.62)',
  settingsBg: 'rgba(103, 65, 190, 0.58)',
  settingsBorder: 'rgba(115, 79, 186, 0.66)',
  rootBg: '#05134a',
};
