import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to Athannotif.web.ts
// and on native platforms to Athannotif.ts
import { ChangeEventPayload, AthannotifViewProps } from './src/Athannotif.types';
import AthannotifModule from './src/AthannotifModule';
import AthannotifView from './src/AthannotifView';

// Get the native constant value.
export const PI = AthannotifModule.PI;

export function hello(): string {
  return AthannotifModule.hello();
}

export async function setValueAsync(value: string) {
  return await AthannotifModule.setValueAsync(value);
}

const emitter = new EventEmitter(AthannotifModule ?? NativeModulesProxy.Athannotif);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { AthannotifView, AthannotifViewProps, ChangeEventPayload };
