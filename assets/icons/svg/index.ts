import { Icon } from '@/shared/types';

import AndroidIcon from './android.svg';
import AppleIcon from './apple.svg';
import BellRingIcon from './bell-ring.svg';
import BellSlashIcon from './bell-slash.svg';
import CloseIcon from './close.svg';
import CompassIcon from './compass.svg';
import DownloadIcon from './download.svg';
import GlobeIcon from './globe.svg';
import MusicNoteIcon from './music-note.svg';
import PauseIcon from './pause.svg';
import PlayIcon from './play.svg';
import QuestionIcon from './question.svg';
import RefreshIcon from './refresh.svg';
import SearchIcon from './search.svg';
import SpeakerIcon from './speaker.svg';
import WidgetIcon from './widget.svg';

const ICONS: Record<Icon, typeof BellRingIcon> = {
  [Icon.BELL_RING]: BellRingIcon,
  [Icon.BELL_SLASH]: BellSlashIcon,
  [Icon.SPEAKER]: SpeakerIcon,
  [Icon.PLAY]: PlayIcon,
  [Icon.PAUSE]: PauseIcon,
  [Icon.QUESTION]: QuestionIcon,
  [Icon.MUSIC_NOTE]: MusicNoteIcon,
  [Icon.COMPASS]: CompassIcon,
  [Icon.CLOSE]: CloseIcon,
  [Icon.WIDGET]: WidgetIcon,
  [Icon.APPLE]: AppleIcon,
  [Icon.ANDROID]: AndroidIcon,
  [Icon.GLOBE]: GlobeIcon,
  [Icon.DOWNLOAD]: DownloadIcon,
  [Icon.REFRESH]: RefreshIcon,
  [Icon.SEARCH]: SearchIcon,
};

export default ICONS;
