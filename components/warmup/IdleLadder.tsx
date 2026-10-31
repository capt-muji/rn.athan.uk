/**
 * The idle ladder's mount point (stores/warmup.ts): arms the ladder once
 * per process and renders the stage's consumers. It rides the launch
 * chrome defer beside the overlay, so the launch commit never carries it.
 */

import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import EntranceRehearsal from '@/components/warmup/EntranceRehearsal';
import SheetWarmup from '@/components/warmup/SheetWarmup';
import { beginIdleLadder, WARMUP_STAGE, warmupStageAtom } from '@/stores/warmup';

export default function IdleLadder() {
  const stage = useAtomValue(warmupStageAtom);

  useEffect(() => {
    beginIdleLadder();
  }, []);

  return (
    <>
      {stage === WARMUP_STAGE.REHEARSAL && <EntranceRehearsal />}
      {stage >= WARMUP_STAGE.SHEET_BODIES && <SheetWarmup />}
    </>
  );
}
