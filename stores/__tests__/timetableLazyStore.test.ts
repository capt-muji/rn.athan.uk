import fs from 'node:fs';
import path from 'node:path';
import * as MMKV from 'react-native-mmkv';

import { __setAssetHash, __setAssetLocalUri } from '@/shared/__mocks__/expo-asset';
import { __setFileBytes } from '@/shared/__mocks__/expo-file-system';

/**
 * The staging store is a native allocation: dev and test builds serve the mock
 * window and never stage, so the athan-timetable instance must not exist until
 * a build first reads or writes staged bytes. The spy is installed before the
 * module loads, because the lazy call can otherwise hide behind import order.
 */

// Same mutable-env trick as timetable.test.ts: the module reads the env per call
var mockBuildEnv = 'local';
jest.mock('@/shared/config', () => {
  const actual = jest.requireActual('@/shared/config');
  return {
    ...actual,
    get APP_CONFIG() {
      return { ...actual.APP_CONFIG, env: mockBuildEnv };
    },
    isProd: () => mockBuildEnv === 'prod',
    isPreview: () => mockBuildEnv === 'preview',
  };
});

const createSpy = jest.spyOn(MMKV, 'createMMKV');
const athanTimetableCalls = () =>
  createSpy.mock.calls.filter(([cfg]) => (cfg as { id?: string } | undefined)?.id === 'athan-timetable');

const REAL_ARTIFACT = new Uint8Array(
  fs.readFileSync(path.resolve(__dirname, '../../assets/data/london-2026-2076.bin'))
);

let Timetable: typeof import('@/stores/timetable');

beforeAll(() => {
  __setFileBytes(REAL_ARTIFACT);
  __setAssetHash('test-asset-hash');
  __setAssetLocalUri('file:///mock/london-2026-2076.bin');
  Timetable = require('@/stores/timetable');
});

afterAll(() => {
  Timetable.__resetTimetableForTest();
  mockBuildEnv = 'local';
});

describe('the staging store', () => {
  it('stays closed while a dev build serves the mock window', async () => {
    await Timetable.ensureTimetableReady();

    expect(Timetable.getTimetableDay('2031-01-01')).toBeNull();
    expect(athanTimetableCalls()).toHaveLength(0);
  });

  it('opens when a prod build stages', async () => {
    mockBuildEnv = 'prod';
    await Timetable.ensureTimetableReady();

    expect(Timetable.getTimetableDay('2027-01-01')).not.toBeNull();
    expect(athanTimetableCalls()).toHaveLength(1);
  });
});
