// Import the native module. On web, it will be resolved to Athan.web.ts
// and on native platforms to Athan.ts
import AthanModule from './src/AthanModule';

// Get the native constant value.
export const PI = AthanModule.PI;

export function hello(): string {
  return AthanModule.hello();
}
