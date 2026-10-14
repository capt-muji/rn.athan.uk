/**
 * The sheet layer's mount point. The launch chrome defer decides whether the
 * sheets mount at all; once they have, this host's locale subscription is what
 * re-renders them on a language switch, because the remount key sits on the
 * screen tree and the width measurement, never on a root that would unmount a
 * presented sheet mid-apply
 */

import { useAtomValue } from 'jotai';

import { localeVersionAtom } from '@/shared/i18n/locale';

import BottomSheetAlert from './screens/Alert';
import BottomSheetLanguage from './screens/Language';
import BottomSheetQibla from './screens/Qibla';
import BottomSheetSettings from './screens/Settings';
import BottomSheetSound from './screens/Sound';

export function SheetHost({ deferred }: { deferred: boolean }) {
  // Unbound on purpose: the subscription alone re-renders the sheet layer
  useAtomValue(localeVersionAtom);
  if (!deferred) return null;
  return (
    <>
      <BottomSheetSound />
      <BottomSheetSettings />
      <BottomSheetLanguage />
      <BottomSheetAlert />
      <BottomSheetQibla />
    </>
  );
}
