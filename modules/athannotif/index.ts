// Import the native module. On web, it will be resolved to Athannotif.web.ts
// and on native platforms to Athannotif.ts
import AthannotifModule from './src/AthannotifModule';

// Get the native constant value.
export const PI = AthannotifModule.PI;

export function hello(): string {
  return AthannotifModule.hello();
}
