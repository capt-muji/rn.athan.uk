import BellRingIcon from './bell-ring.svg';
import BellSlashIcon from './bell-slash.svg';
import CheckIcon from './check.svg';
import CloseIcon from './close.svg';
import InfoIcon from './info.svg';
import PauseIcon from './pause.svg';
import PlayIcon from './play.svg';
import SpeakerIcon from './speaker.svg';

import { Icon } from '@/shared/types';

const ICONS: Record<Icon, typeof BellRingIcon> = {
  [Icon.BELL_RING]: BellRingIcon,
  [Icon.BELL_SLASH]: BellSlashIcon,
  [Icon.SPEAKER]: SpeakerIcon,
  [Icon.PLAY]: PlayIcon,
  [Icon.PAUSE]: PauseIcon,
  [Icon.INFO]: InfoIcon,
  [Icon.CHECK]: CheckIcon,
  [Icon.CLOSE]: CloseIcon,
};

export default ICONS;
