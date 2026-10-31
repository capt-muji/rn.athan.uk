import {
  type AudioPlayer,
  type AudioSource,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ATHAN_DURATION_SECONDS, athanAudio } from '@/assets/audio';
import { IconView } from '@/components/ui';
import { useCachedGeometry } from '@/hooks/useCachedGeometry';
import { useNotification } from '@/hooks/useNotification';
import { ANIMATION, COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import logger from '@/shared/logger';
import { deferPastNextPaint } from '@/shared/nextPaint';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { soundPreferenceAtom } from '@/stores/notifications';
import {
  playingSoundIndexAtom,
  setBottomSheetModal,
  setPlayingSoundIndex,
  setSoundListReady,
  soundListReadyAtom,
} from '@/stores/ui';

import { Sheet, SoundItem, VolumeNote } from '../parts';
import { displayedSoundSelection, hasSoundDraft, isPreviewFinished, previewRemainingSeconds } from './soundSheet';

const ITEM_GAP = SPACING.xs;

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_sound';

/** What the engine reports to the sheet: the player identity and its latest status payload */
interface EngineStatus {
  playerId: string;
  statusId: string;
  playing: boolean;
  currentTime: number;
  duration: number;
}

/** The stand-in before any engine exists: never the current player, so the tabulated seconds answer */
const NO_ENGINE_STATUS: EngineStatus = {
  playerId: 'no engine',
  statusId: 'no engine',
  playing: false,
  currentTime: 0,
  duration: 0,
};

interface EngineProps {
  /** Set by a play press; the engine consumes it, so a mount-time playing index never autoplays */
  pendingPlay: { current: boolean };
  onPlayer: (player: AudioPlayer) => void;
  onStatus: (status: EngineStatus) => void;
}

/**
 * The playback engine, mounted only once the sound sheet has first presented
 * (owner order 5110): expo-audio, its ExoPlayer and its MediaSession come to
 * life at construction, so nothing audio exists until a surface that plays is
 * actually open. Renders nothing.
 */
function SoundAudioEngine({ pendingPlay, onPlayer, onStatus }: EngineProps) {
  const playingIndex = useAtomValue(playingSoundIndexAtom);
  // The clip module resolves here, on the play press that set the index - the inline require
  const playingSource = playingIndex !== null ? (athanAudio(playingIndex) as AudioSource) : null;
  const player = useAudioPlayer(playingSource);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    onPlayer(player);
  }, [player, onPlayer]);

  // Playback is armed from a press: switching rows swaps the player
  // instance, so play() must run after the new source exists.
  useEffect(() => {
    if (playingIndex === null || !pendingPlay.current) return;
    pendingPlay.current = false;
    player.seekTo(0);
    player.play();
  }, [playingIndex, player, pendingPlay]);

  // Clip finished — clear the playing row. The status hook keeps the released player's
  // last payload until the replacement emits its own; a status from another
  // instance must never reap a freshly armed one (ISSUES #25).
  useEffect(() => {
    const finished = isPreviewFinished({
      playingIndex,
      playerId: player.id,
      statusId: status.id,
      playing: status.playing,
      currentTime: status.currentTime,
      duration: status.duration,
    });
    if (finished) setPlayingSoundIndex(null);
  }, [playingIndex, player.id, status.id, status.playing, status.currentTime, status.duration]);

  useEffect(() => {
    onStatus({
      playerId: player.id,
      statusId: status.id,
      playing: status.playing,
      currentTime: status.currentTime,
      duration: status.duration,
    });
  }, [player.id, status.id, status.playing, status.currentTime, status.duration, onStatus]);

  return null;
}

export default function BottomSheetSound() {
  const { commitSoundSelection } = useNotification();
  const selectedSound = useAtomValue(soundPreferenceAtom);
  const playingIndex = useAtomValue(playingSoundIndexAtom);
  // The 32-row list mounts only once the settings sheet has fully opened
  // (the only path here runs through it) — off the launch path AND complete
  // by the first present, so the sheet never pops in. The self-trigger
  // covers any path that skips settings.
  const soundListReady = useAtomValue(soundListReadyAtom);
  const [tempSoundSelection, setTempSoundSelection] = useState<number | null>(null);
  // Seeded from the MMKV cache at mount so a session's first open positions the
  // indicator from the start; the first live layout corrects a stale seed, and
  // the cache is written back only after the sheet settles open
  const [itemHeight, measureItemHeight] = useCachedGeometry(`sound_row_height_${currentLocaleId()}`, 'replace');
  const hasInitialized = useRef(false);
  const translateY = useSharedValue(0);
  // The first row's measured height is taken once, so a later layout cannot resize the
  // highlight away from the rows it sits behind
  const heightTakenRef = useRef(false);

  // The audio session arms at this sheet's first full open (owner order 5110):
  // rows are visible only once the sheet has presented, so the mode call always
  // precedes any play press
  const [audioSessionArmed, setAudioSessionArmed] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const pendingPlayRef = useRef(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(NO_ENGINE_STATUS);

  const currentSelection = displayedSoundSelection(tempSoundSelection, selectedSound);

  const handleArmAudioSession = useCallback(() => {
    if (audioSessionArmed) return;
    setAudioSessionArmed(true);
    // Athan previews must be audible regardless of the ring/silent switch (moved from
    // the root layout, owner order 5110): until a mode is set explicitly, the app runs
    // on iOS's default session category (.soloAmbient), which the mute switch silences
    setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
      logger.warn('AUDIO: Failed to set audio mode', { error });
    });
  }, [audioSessionArmed]);

  const handlePlayerReady = useCallback((player: AudioPlayer) => {
    playerRef.current = player;
  }, []);

  // ONE player for the whole sheet (was one per row — 32 concurrent
  // AVPlayers exhausted audio resources on older devices, G.4/G.5). The hook
  // releases and recreates the player when the source changes, so exactly
  // one instance is ever alive.
  const handlePlayPress = useCallback(
    (index: number) => {
      if (playingIndex === index) {
        playerRef.current?.pause();
        setPlayingSoundIndex(null);
        return;
      }
      pendingPlayRef.current = true;
      setPlayingSoundIndex(index);
    },
    [playingIndex]
  );

  const handleItemLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height;
      if (heightTakenRef.current || height <= 0) return;
      heightTakenRef.current = true;
      measureItemHeight(height);
    },
    [measureItemHeight]
  );

  // Update translateY: no animation on first render, animate on subsequent changes
  useEffect(() => {
    if (itemHeight === 0) return;

    const targetY = currentSelection * (itemHeight + ITEM_GAP);

    if (!hasInitialized.current) {
      translateY.value = targetY;
      hasInitialized.current = true;
    } else {
      translateY.value = withTiming(targetY, { duration: ANIMATION.duration });
    }
  }, [currentSelection, itemHeight, translateY]);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }],
      height: itemHeight,
      opacity: itemHeight > 0 ? 1 : 0,
    }),
    [itemHeight]
  );

  const clearAudio = useCallback(() => setPlayingSoundIndex(null), []);

  // Primitive-only props feed the memoized rows: the status object changes
  // identity many times per second during playback — deriving whole seconds
  // here means a tick only re-renders the playing row, and only when its
  // displayed countdown second actually changes. Live values come only from
  // the current player (a stale payload from the released instance would
  // flash the previous clip's leftover seconds, ISSUES #25), rounded so the
  // first value stays steady while iOS refines its provisional duration;
  // until the fresh player reports, the clip's tabulated seconds stand in
  // so the countdown lands in the same frame as the icon flip. With no
  // engine yet the same stand-in answers (NO_ENGINE_STATUS never matches).
  const playingRemainingSeconds = previewRemainingSeconds(
    {
      playingIndex,
      playerId: engineStatus.playerId,
      statusId: engineStatus.statusId,
      playing: engineStatus.playing,
      currentTime: engineStatus.currentTime,
      duration: engineStatus.duration,
    },
    ATHAN_DURATION_SECONDS
  );

  const handleDismiss = useCallback(async () => {
    clearAudio();

    if (!hasSoundDraft(tempSoundSelection)) return;

    await deferPastNextPaint();

    // The commit persists before it schedules (the scheduler reads the
    // preference mid-flight) and rolls the preference back itself if either
    // scheduling call rejects, so the displayed Athan can no longer disagree
    // with the one the OS will play. onDismiss is typed `() => void` and is
    // called un-awaited, so an escaping rejection here would be silent.
    await commitSoundSelection(tempSoundSelection);

    // Cleared on BOTH outcomes. Leaving the draft behind after a failure meant
    // the next dismiss re-committed a selection the user had not touched again.
    setTempSoundSelection(null);
  }, [tempSoundSelection, clearAudio, commitSoundSelection]);

  return (
    <Sheet
      setRef={setBottomSheetModal}
      title={t('sound.title')}
      subtitle={t('sheet.closeToSave')}
      icon={<IconView type={Icon.SPEAKER} size={16} color={SHEET_ICON_COLOR} />}
      snapPoints={['85%']}
      onDismiss={handleDismiss}
      onAnimate={clearAudio}
      perfName={SHEET_PERF_NAME}
      onFirstPresent={setSoundListReady}
      onPresent={handleArmAudioSession}
      stackBehavior={'push'}>
      {/* The playback engine mounts at this sheet's first full open (owner order
          5110): nothing audio initialises at launch, and rows are reachable only
          once the sheet has presented, so the player always exists before a
          press can ask it to play */}
      {audioSessionArmed && (
        <SoundAudioEngine pendingPlay={pendingPlayRef} onPlayer={handlePlayerReady} onStatus={setEngineStatus} />
      )}
      {/* Card + 32 rows mount once the settings sheet (the only path here)
          has fully opened — invisible warming, complete before first present */}
      {soundListReady && (
        <View style={styles.card}>
          <Text style={styles.cardHint}>{t('sound.notificationSound')}</Text>

          <View testID={'sound-list'} style={styles.listContainer}>
            {/* Sliding indicator */}
            <Animated.View style={[styles.indicator, indicatorStyle]} />

            {/* Sound items */}
            {ATHAN_DURATION_SECONDS.map((_, index) => (
              <SoundItem
                // biome-ignore lint/suspicious/noArrayIndexKey: ATHAN_DURATION_SECONDS is a static list, never reordered or filtered
                key={index}
                index={index}
                isSelected={index === currentSelection}
                isPlaying={playingIndex === index}
                remainingSeconds={playingIndex === index ? playingRemainingSeconds : 0}
                onSelect={setTempSoundSelection}
                onPlayPress={handlePlayPress}
                onLayout={index === 0 ? handleItemLayout : undefined}
              />
            ))}
          </View>
        </View>
      )}
      <VolumeNote />
    </Sheet>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },

  // List
  listContainer: {
    marginTop: SPACING.md,
    gap: ITEM_GAP,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    backgroundColor: COLORS.interactive.active,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
  },
});
