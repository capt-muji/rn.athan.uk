// Feature flags default ON for tests: suites exercising gated paths (widget
// pushes) run enabled. Disabled-path tests delete the variable and reset
// modules to evaluate shared/flags.ts fresh.
process.env.EXPO_PUBLIC_WIDGETS = '1';
