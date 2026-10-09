/**
 * React's hooks for hook tests that need state to survive between renders
 *
 * The test tree has no renderer, so a hook runs inside a modelled component: hook state lives in slots read back in
 * call order, effects run after the render that declared them when their dependencies changed (every due cleanup
 * before any new run), cleanups also run on unmount, and a state change renders again with the last props. State set
 * while effects run is batched into one render after them; state set from a timer or callback renders at once for
 * each set, where React would batch. Concurrent rendering and StrictMode's double calls are not modelled, so nothing
 * that depends on them is proven by these tests.
 *
 * A test wires it in with `jest.mock('react', () => require('./hookHarness').react)`.
 */

type Deps = readonly unknown[] | undefined;
type Cleanup = (() => void) | undefined;

interface EffectRecord {
  deps: Deps;
  effect: () => unknown;
  cleanup: Cleanup;
  hasRun: boolean;
}

interface Component {
  slots: unknown[];
  cursor: number;
  hookCount: number | null;
  effects: EffectRecord[];
  due: EffectRecord[];
  isRunningEffects: boolean;
  needsRender: boolean;
  isUnmounted: boolean;
  render: () => void;
}

let rendering: Component | null = null;

const inRender = (): Component => {
  if (!rendering) throw new Error('A hook was called outside a render');
  return rendering;
};

const haveChanged = (previous: Deps, next: Deps) =>
  previous === undefined ||
  next === undefined ||
  previous.length !== next.length ||
  next.some((dep, index) => !Object.is(dep, previous[index]));

/** One hook's state: created on the first render and handed back on every later one */
export const useSlot = <T>(create: () => T): T => {
  const component = inRender();
  const index = component.cursor++;
  if (index === component.slots.length) component.slots.push(create());
  return component.slots[index] as T;
};

const useRef = <T>(initial: T) => useSlot(() => ({ current: initial }));

const useState = <T>(initial: T | (() => T)) => {
  const component = inRender();
  const state = useSlot(() => {
    const box = {
      value: typeof initial === 'function' ? (initial as () => T)() : initial,
      set: (next: T | ((previous: T) => T)) => {
        if (rendering) throw new Error('Setting state during a render is not modelled');
        const value = typeof next === 'function' ? (next as (previous: T) => T)(box.value) : next;
        if (component.isUnmounted || Object.is(value, box.value)) return;
        box.value = value;
        if (component.isRunningEffects) component.needsRender = true;
        else component.render();
      },
    };
    return box;
  });
  return [state.value, state.set] as const;
};

const useEffect = (effect: () => unknown, deps?: Deps) => {
  const component = inRender();
  const record = useSlot<EffectRecord>(() => {
    const created: EffectRecord = { deps, effect, cleanup: undefined, hasRun: false };
    component.effects.push(created);
    return created;
  });
  if (record.hasRun && !haveChanged(record.deps, deps)) return;
  record.deps = deps;
  record.effect = effect;
  component.due.push(record);
};

const useCallback = <T>(callback: T, deps: Deps): T => {
  const memo = useSlot(() => ({ deps, callback }));
  if (haveChanged(memo.deps, deps)) Object.assign(memo, { deps, callback });
  return memo.callback;
};

export const react = { useCallback, useEffect, useRef, useState };

export interface MountedHook<Props, Result> {
  readonly result: Result;
  rerender: (props?: Props) => void;
  unmount: () => void;
}

/** Mounts a component whose only content is `hook`, and runs its effects as a commit would */
export const mountHook = <Props, Result>(
  hook: (props: Props) => Result,
  initialProps: Props
): MountedHook<Props, Result> => {
  let props = initialProps;
  let result: Result | undefined;

  const component: Component = {
    slots: [],
    cursor: 0,
    hookCount: null,
    effects: [],
    due: [],
    isRunningEffects: false,
    needsRender: false,
    isUnmounted: false,
    render: () => {
      if (rendering) throw new Error('Nested renders are not modelled');
      component.cursor = 0;
      rendering = component;
      try {
        result = hook(props);
      } finally {
        rendering = null;
      }

      if (component.hookCount === null) component.hookCount = component.cursor;
      else if (component.hookCount !== component.cursor) throw new Error('A render called a different number of hooks');

      const due = component.due;
      component.due = [];
      component.isRunningEffects = true;
      try {
        for (const record of due) record.cleanup?.();
        for (const record of due) {
          const cleanup = record.effect();
          record.cleanup = typeof cleanup === 'function' ? (cleanup as () => void) : undefined;
          record.hasRun = true;
        }
      } finally {
        component.isRunningEffects = false;
      }

      if (component.needsRender) {
        component.needsRender = false;
        component.render();
      }
    },
  };

  component.render();

  return {
    get result() {
      return result as Result;
    },
    rerender: (nextProps = props) => {
      if (component.isUnmounted) throw new Error('An unmounted component cannot render');
      props = nextProps;
      component.render();
    },
    unmount: () => {
      component.isUnmounted = true;
      for (const record of component.effects) record.cleanup?.();
    },
  };
};
