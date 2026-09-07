import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { isRamadan } from '@/shared/time';
import { decorationsEnabledAtom } from '@/stores/ui';

const AnimatedImage = Animated.createAnimatedComponent(Image);

// All decoration art renders from pre-rasterized sprites (rsvg output from the
// exact gradient/mask/path definitions that used to live below): animated SVG
// props (wire y2, glow circle opacity) forced react-native-svg to re-render its
// tree EVERY frame — a continuous 24ms/frame UI-thread load on the SD820 with
// decorations visible. Sprites keep every animation (bob, scale, opacity,
// flicker, drift) as GPU-composited View transforms/opacities instead.
const SPRITES = {
  moonGlow: require('@/assets/icons/png/decorations/moon-glow.png'),
  moonCrescent: require('@/assets/icons/png/decorations/moon-crescent.png'),
  starGlow: require('@/assets/icons/png/decorations/star-glow.png'),
  lanternGlow: require('@/assets/icons/png/decorations/lantern-glow.png'),
  lanternFlicker: require('@/assets/icons/png/decorations/lantern-flicker.png'),
  starBody: require('@/assets/icons/png/decorations/star-body.png'),
  lanternBody: require('@/assets/icons/png/decorations/lantern-body.png'),
  cloudRear0: require('@/assets/icons/png/decorations/cloud-rear-0.png'),
  cloudFront1: require('@/assets/icons/png/decorations/cloud-front-1.png'),
  cloudTop2: require('@/assets/icons/png/decorations/cloud-top-2.png'),
} as const;

// --- Colors (tuned for #031a4c → #5b1eaa background) — wires render as Views ---
const MOON_COLOR = '#FFC947';
const THREAD_COLOR = '#C9A87C';
const GLOW_PULSE_DURATION = 3000;

/** Hanging configs — variable speeds, distances, glow delays, depth, and types */
const HANGINGS: {
  xPct: number;
  lineLen: number;
  size: number;
  bobDuration: number;
  glowDelay: number;
  dropFraction: number;
  type: 'star' | 'lantern';
  threadWidth: number;
  threadOpacity: number;
  bodyOpacity: number;
  glowMin: number;
  glowMax: number;
}[] = [
  // Midground star (right) — slow, wide sway
  {
    xPct: 0.87,
    lineLen: 77,
    size: 6.6,
    bobDuration: 7130,
    glowDelay: 1200,
    dropFraction: 0.4,
    type: 'star',
    threadWidth: 0.5,
    threadOpacity: 0.07,
    bodyOpacity: 1,
    glowMin: 0.4,
    glowMax: 0.7,
  },
  // Foreground lantern (right) — strongest presence
  {
    xPct: 0.78,
    lineLen: 95,
    size: 7.2,
    bobDuration: 6875,
    glowDelay: 1600,
    dropFraction: 1.4,
    type: 'lantern',
    threadWidth: 0.7,
    threadOpacity: 0.14,
    bodyOpacity: 1,
    glowMin: 0.5,
    glowMax: 0.9,
  },
  // Background star (left) — quick, shallow bounce
  {
    xPct: 0.26,
    lineLen: 68,
    size: 5.3,
    bobDuration: 3400,
    glowDelay: 200,
    dropFraction: 0.35,
    type: 'star',
    threadWidth: 0.35,
    threadOpacity: 0.04,
    bodyOpacity: 1,
    glowMin: 0.3,
    glowMax: 0.55,
  },
];

/** Randomized cloud configs — height relative to moon, wrapping across screen */
function useCloudConfigs(moonR: number, moonCy: number, moonBobMax: number, screenWidth: number, starMaxY: number) {
  return useMemo(() => {
    const moonH = moonR * 2;
    // Height constraints: 70% – 200% of moon height, +30% size boost
    const sizeBoost = 1.3;
    const minH = moonH * 0.7 * sizeBoost;
    const maxH = moonH * 2 * sizeBoost;

    // Two base heights + third at 1.5× the largest
    const smallH = minH + Math.random() * (maxH * 0.4 - minH);
    const largeH = Math.min(smallH * (1.3 + Math.random() * 0.7), maxH);
    const topH = largeH * 1.5;

    const smallScale = smallH / 100;
    const largeScale = largeH / 100;
    const topScale = topH / 100;

    // Opacity proportional to cloud height (32-60% range)
    const heights = [smallH, largeH, topH];
    const hMin = Math.min(...heights);
    const hMax = Math.max(...heights);
    const hRange = hMax - hMin || 1;
    const opacityFor = (h: number) => 0.27 + ((h - hMin) / hRange) * 0.24;

    // Same random direction for all
    const direction = Math.random() > 0.5 ? 1 : -1;

    // Random start positions (0-1 progress offset)
    const startPos = [Math.random(), Math.random(), Math.random()];

    // Speed: base ~36-46s to cross screen
    const baseDuration = 40635 + Math.random() * 11288;

    // Cloud widths (for wrapping distance calc, include mist padding)
    const smallW = 160 * smallScale * 1.4;
    const largeW = 160 * largeScale * 1.4;
    const topW = 160 * topScale * 1.4;

    // Lowest point clouds can touch = middle of moon's vertical movement
    const moonMidY = moonCy + moonBobMax / 2 + moonR;
    // Small cloud bottom at moon mid-bob point
    const smallCloudTop = moonMidY - smallH;
    // Large cloud starts from halfway up the small cloud
    const largeCloudTop = smallCloudTop + smallH / 2 - largeH;

    // Top cloud: always higher than both, not connected
    // Min clearance: touching the higher cloud or clearing by 70% of second largest (largeH)
    const higherCloudTop = Math.min(smallCloudTop, largeCloudTop);
    const minClearance = largeH * 0.7;
    // Bottom of top cloud can be at most at higherCloudTop (touching) minus clearance
    const topCloudMaxBottom = higherCloudTop - minClearance;
    // Top cloud can't go higher than the max star height
    const topCloudMinTop = starMaxY - topH;
    // Random position between min top and max bottom
    const topCloudMaxTop = topCloudMaxBottom - topH;
    const topCloudTop = topCloudMinTop + Math.random() * Math.max(0, topCloudMaxTop - topCloudMinTop);

    return {
      direction,
      clouds: [
        // Small (back) cloud
        {
          scale: smallScale,
          opacity: opacityFor(smallH),
          sprite: SPRITES.cloudRear0,
          top: smallCloudTop,
          totalDist: screenWidth + smallW,
          duration: baseDuration,
          startPos: startPos[0],
        },
        // Large (mid) cloud
        {
          scale: largeScale,
          opacity: opacityFor(largeH),
          sprite: SPRITES.cloudFront1,
          top: largeCloudTop,
          totalDist: screenWidth + largeW,
          duration: baseDuration * 0.85,
          startPos: startPos[1],
        },
        // Top (largest) cloud — 1.5× large, highest position
        {
          scale: topScale,
          opacity: opacityFor(topH),
          sprite: SPRITES.cloudTop2,
          top: topCloudTop,
          totalDist: screenWidth + topW,
          duration: baseDuration * 0.7,
          startPos: startPos[2],
        },
      ],
    };
  }, [moonR, moonCy, moonBobMax, screenWidth, starMaxY]);
}

/** Spark/firefly particles around lantern glow */
const SPARK_COLOR = '#FFD700'; // bright gold
const SPARK_COLOR_HOT = '#FFF1A8'; // hot white-gold for larger sparks
const SPARKS = [
  { angle: 8, dist: 0.53, size: 0.9, delay: 0, duration: 2800, drift: 2, hot: true },
  { angle: 62, dist: 0.74, size: 0.4, delay: 400, duration: 1500, drift: 5, hot: false },
  { angle: 101, dist: 0.58, size: 0.7, delay: 1200, duration: 2200, drift: 3, hot: true },
  { angle: 143, dist: 0.78, size: 0.35, delay: 700, duration: 1400, drift: 4.5, hot: false },
  { angle: 196, dist: 0.52, size: 0.85, delay: 200, duration: 3200, drift: 1.5, hot: true },
  { angle: 232, dist: 0.68, size: 0.5, delay: 1500, duration: 1700, drift: 5.5, hot: false },
  { angle: 279, dist: 0.63, size: 0.55, delay: 900, duration: 2600, drift: 3.5, hot: false },
  { angle: 337, dist: 0.5, size: 0.7, delay: 500, duration: 3500, drift: 1, hot: true },
];

/** Spark particles for the moon — fewer and softer than lantern */
const MOON_SPARKS = [
  { angle: 30, dist: 0.55, size: 0.7, delay: 0, duration: 3200, drift: 2.5, hot: true },
  { angle: 120, dist: 0.7, size: 0.35, delay: 600, duration: 1800, drift: 4, hot: false },
  { angle: 200, dist: 0.5, size: 0.8, delay: 1100, duration: 2700, drift: 2, hot: true },
  { angle: 270, dist: 0.65, size: 0.4, delay: 400, duration: 2100, drift: 3.5, hot: false },
  { angle: 340, dist: 0.48, size: 0.6, delay: 800, duration: 3600, drift: 1.5, hot: true },
];

export default function RamadanDecorations() {
  const { width, height } = useWindowDimensions();
  const { top: insetTop } = useSafeAreaInsets();

  // Shared values for each hanging (hooks can't be called in loops)
  const bob0 = useSharedValue(0);
  const bob1 = useSharedValue(0);
  const bob2 = useSharedValue(0);
  const glow0 = useSharedValue(0);
  const glow1 = useSharedValue(0);
  const glow2 = useSharedValue(0);
  const bobs = [bob0, bob1, bob2];
  const glows = [glow0, glow1, glow2];

  // Lantern candle flicker
  const lanternFlicker = useSharedValue(0.6);

  // Cloud progress (0→1 linear, wrapping)
  const cloudProg0 = useSharedValue(0);
  const cloudProg1 = useSharedValue(0);
  const cloudProg2 = useSharedValue(0);
  const cloudProgs = [cloudProg0, cloudProg1, cloudProg2];

  // Moon motion
  const moonBob = useSharedValue(0);
  const moonGlowOpacity = useSharedValue(0);

  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  // Invisible decorations must not run animations: the effect below arms ~13
  // infinite Reanimated loops that tick the UI thread at 60fps for ~10 months
  // a year while this component renders nothing (measured 93% main-thread CPU
  // idle on the 3T). Visibility re-evaluates on every render; the effect
  // re-arms when it flips true.
  const visible = isRamadan() && decorationsEnabled;

  // Android height includes nav bar — scale down vertical positions
  const vScale = Platform.OS === 'android' ? 0.6 : 1;
  const svgHeight = height * 0.385 * vScale;
  const moonCx = width * 0.16;
  const moonCy = insetTop + 62;
  const moonR = 15;
  const maxStarY = insetTop + 65;

  // Upper crescent tip (intersection of main circle and mask circle)
  const moonTipX = moonCx - 5.3;
  const moonTipY = moonCy - 17.7;

  // Moon glow radius (determines the sprite View size)
  const moonGlowR = moonR * 2.7;
  const moonSpriteSize = moonGlowR * 2;

  const moonBobMax = 7; // matches the withTiming(7, ...) in useEffect
  // Highest point any star reaches (smallest lineLen + size)
  const starHighestY = Math.min(...HANGINGS.filter((h) => h.type === 'star').map((h) => h.lineLen * vScale + h.size));
  const cloudConfig = useCloudConfigs(moonR, moonCy, moonBobMax, width, starHighestY);

  // biome-ignore lint/correctness/useExhaustiveDependencies: bobs/glows/cloudProgs arrays are re-created each render; their stable shared-value elements are the listed deps
  useEffect(() => {
    if (!visible) return;

    const ease = Easing.inOut(Easing.ease);

    HANGINGS.forEach((star, i) => {
      const scaledLen = star.lineLen * vScale;
      const baseStarY = scaledLen + star.size;
      const maxDrop = Math.max(0, maxStarY - baseStarY) * star.dropFraction;

      bobs[i].value = withRepeat(
        withSequence(
          withTiming(maxDrop, { duration: star.bobDuration, easing: ease }),
          withTiming(0, { duration: star.bobDuration, easing: ease })
        ),
        -1
      );
      glows[i].value = star.glowMin;
      glows[i].value = withDelay(
        star.glowDelay,
        withRepeat(
          withSequence(
            withTiming(star.glowMax, { duration: GLOW_PULSE_DURATION, easing: ease }),
            withTiming(star.glowMin, { duration: GLOW_PULSE_DURATION, easing: ease })
          ),
          -1
        )
      );
    });

    // Lantern candle flicker — irregular sequence to feel organic
    const flickerEase = Easing.inOut(Easing.quad);
    lanternFlicker.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 500, easing: flickerEase }),
        withTiming(0.55, { duration: 700, easing: flickerEase }),
        withTiming(0.75, { duration: 400, easing: flickerEase }),
        withTiming(0.6, { duration: 800, easing: flickerEase }),
        withTiming(0.85, { duration: 550, easing: flickerEase }),
        withTiming(0.5, { duration: 750, easing: flickerEase }),
        withTiming(0.7, { duration: 450, easing: flickerEase }),
        withTiming(0.55, { duration: 900, easing: flickerEase }),
        withTiming(0.78, { duration: 600, easing: flickerEase }),
        withTiming(0.6, { duration: 650, easing: flickerEase })
      ),
      -1
    );

    // Cloud progress — linear wrapping loop, random start position
    cloudConfig.clouds.forEach((cloud, i) => {
      // Start at random position, complete first partial cycle, then full loops
      const remaining = 1 - cloud.startPos;
      cloudProgs[i].value = cloud.startPos;
      cloudProgs[i].value = withSequence(
        withTiming(1, { duration: cloud.duration * remaining, easing: Easing.linear }),
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, { duration: cloud.duration, easing: Easing.linear })
          ),
          -1
        )
      );
    });

    // Moon gentle bob
    moonBob.value = withRepeat(
      withSequence(
        withTiming(moonBobMax, { duration: 4500, easing: ease }),
        withTiming(0, { duration: 4500, easing: ease })
      ),
      -1
    );

    // Moon glow pulse
    moonGlowOpacity.value = 0.55;
    moonGlowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: GLOW_PULSE_DURATION, easing: ease }),
        withTiming(0.55, { duration: GLOW_PULSE_DURATION, easing: ease })
      ),
      -1
    );
  }, [
    bob0,
    bob1,
    bob2,
    cloudConfig,
    cloudProg0,
    cloudProg1,
    cloudProg2,
    glow0,
    glow1,
    glow2,
    lanternFlicker,
    maxStarY,
    moonBob,
    moonGlowOpacity,
    visible,
  ]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {/* Wires: thin strips whose scaleY (origin at the top) follows the same
          bob shared values that move the hangings — GPU transform, no SVG */}
      <WireStrip x={moonTipX} baseLen={moonTipY} bobOffset={moonBob} width={0.4} opacity={0.06} />

      {HANGINGS.map((star, i) => (
        <WireStrip
          // biome-ignore lint/suspicious/noArrayIndexKey: HANGINGS is a static decorative config, never reordered
          key={i}
          x={width * star.xPct}
          baseLen={star.lineLen * vScale}
          bobOffset={bobs[i]}
          width={star.threadWidth}
          opacity={star.threadOpacity}
        />
      ))}

      {/* zIndex 1: Moon */}
      <FloatingMoon
        cx={moonCx}
        cy={moonCy}
        r={moonR}
        glowR={moonGlowR}
        spriteSize={moonSpriteSize}
        bobOffset={moonBob}
        glowOpacity={moonGlowOpacity}
        zIndex={1}
      />

      {/* zIndex 2: Left star */}
      <FloatingStar
        index={0}
        x={width * HANGINGS[0].xPct}
        lineLen={HANGINGS[0].lineLen * vScale}
        size={HANGINGS[0].size}
        type={HANGINGS[0].type}
        bobOffset={bobs[0]}
        glowOpacity={glows[0]}
        bodyOpacity={HANGINGS[0].bodyOpacity}
        zIndex={2}
      />

      {/* zIndex 3: Right star */}
      <FloatingStar
        index={2}
        x={width * HANGINGS[2].xPct}
        lineLen={HANGINGS[2].lineLen * vScale}
        size={HANGINGS[2].size}
        type={HANGINGS[2].type}
        bobOffset={bobs[2]}
        glowOpacity={glows[2]}
        bodyOpacity={HANGINGS[2].bodyOpacity}
        zIndex={3}
      />

      {/* zIndex 4-6: clouds (back → front) */}
      {cloudConfig.clouds.map((cloud, i) => (
        <MistyCloud
          // biome-ignore lint/suspicious/noArrayIndexKey: stable cloud config order
          key={i}
          config={cloud}
          direction={cloudConfig.direction}
          screenWidth={width}
          progress={cloudProgs[i]}
          zIndex={4 + i}
        />
      ))}

      {/* zIndex 7: Lantern — in front of everything */}
      <FloatingStar
        index={1}
        flickerOpacity={lanternFlicker}
        x={width * HANGINGS[1].xPct}
        lineLen={HANGINGS[1].lineLen * vScale}
        size={HANGINGS[1].size}
        type={HANGINGS[1].type}
        bobOffset={bobs[1]}
        glowOpacity={glows[1]}
        bodyOpacity={HANGINGS[1].bodyOpacity}
        zIndex={7}
      />
    </View>
  );
}

/** Wire strip — scaleY (origin top) replaces the SVG's animated y2 1:1 */
function WireStrip({
  x,
  baseLen,
  bobOffset,
  width,
  opacity,
}: {
  x: number;
  baseLen: number;
  bobOffset: SharedValue<number>;
  width: number;
  opacity: number;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: (baseLen + bobOffset.value) / baseLen }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - width / 2,
          top: 0,
          width,
          height: baseLen,
          backgroundColor: THREAD_COLOR,
          opacity,
        },
        styles.wireOrigin,
        style,
      ]}
    />
  );
}

/** Moon crescent + glow — own Animated.View so translateY works */
function FloatingMoon({
  cx,
  cy,
  r,
  glowR,
  spriteSize,
  bobOffset,
  glowOpacity,
  zIndex,
}: {
  cx: number;
  cy: number;
  r: number;
  glowR: number;
  spriteSize: number;
  bobOffset: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  zIndex?: number;
}) {
  // Glow is offset (-2, +4) from moon center — pad the sprite box so it isn't clipped
  const padLeft = 2;
  const padBottom = 4;
  const boxW = spriteSize + padLeft;
  const boxH = spriteSize + padBottom;
  const localCx = glowR + padLeft;
  const localCy = glowR;

  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: cx - glowR - padLeft, top: cy - glowR, width: boxW, height: boxH, zIndex },
        moveStyle,
      ]}>
      <AnimatedImage
        source={SPRITES.moonGlow}
        style={[
          styles.sprite,
          {
            position: 'absolute',
            left: localCx - 2 - glowR,
            top: localCy + 4 - glowR,
            width: spriteSize,
            height: spriteSize,
          },
          glowStyle,
        ]}
      />
      <Image
        source={SPRITES.moonCrescent}
        style={[
          styles.sprite,
          { position: 'absolute', left: localCx - r, top: localCy - r, width: r * 2, height: r * 2 },
        ]}
      />
      <MoonSparks cx={localCx - 2} cy={localCy + 4} glowR={glowR * 0.6} />
    </Animated.View>
  );
}

/** Star/lantern body + glow sprites — Animated.View with translateY for reliable movement */
function FloatingStar({
  index,
  flickerOpacity,
  x,
  lineLen,
  size,
  type,
  bobOffset,
  glowOpacity,
  bodyOpacity,
  zIndex,
}: {
  index: number;
  flickerOpacity?: SharedValue<number>;
  x: number;
  lineLen: number;
  size: number;
  type: 'star' | 'lantern';
  bobOffset: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  bodyOpacity: number;
  zIndex?: number;
}) {
  const visualSize = type === 'lantern' ? size * 1.5 : size;
  const glowR = visualSize * 4;
  const baseStarY = lineLen + size; // attachment point stays based on original size
  const spriteSize = glowR * 2;
  const cx = glowR;
  const cy = glowR;
  const isStarType = type === 'star';

  const moveStyle = useAnimatedStyle(() => ({
    transform: isStarType
      ? [{ translateY: bobOffset.value }, { scale: 0.7 + glowOpacity.value * 0.5 }]
      : [{ translateY: bobOffset.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const flickerStyle = useAnimatedStyle(() => ({
    opacity: flickerOpacity ? flickerOpacity.value : 0,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - glowR,
          top: baseStarY - glowR,
          width: spriteSize,
          height: spriteSize,
          zIndex,
        },
        moveStyle,
      ]}>
      <AnimatedImage
        source={type === 'lantern' ? SPRITES.lanternGlow : SPRITES.starGlow}
        style={[styles.sprite, styles.fill, glowStyle]}
      />
      {type === 'lantern' && (
        <AnimatedImage
          source={SPRITES.lanternFlicker}
          style={[
            styles.sprite,
            {
              position: 'absolute',
              left: cx - glowR * 0.45,
              top: cy + visualSize * 0.3 - glowR * 0.45,
              width: glowR * 0.9,
              height: glowR * 0.9,
            },
            flickerStyle,
          ]}
        />
      )}
      {type === 'lantern' ? (
        <Image
          source={SPRITES.lanternBody}
          style={[
            styles.sprite,
            {
              position: 'absolute',
              left: cx - (visualSize * 3.6) / 2,
              top: cy - (visualSize * 3.6) / 2,
              width: visualSize * 3.6,
              height: visualSize * 3.6,
              opacity: bodyOpacity,
            },
          ]}
        />
      ) : (
        <Image
          source={SPRITES.starBody}
          style={[
            styles.sprite,
            {
              position: 'absolute',
              left: cx - visualSize,
              top: cy - visualSize,
              width: visualSize * 2,
              height: visualSize * 2,
              opacity: bodyOpacity,
            },
          ]}
        />
      )}
      {type === 'lantern' && <LanternSparks cx={cx} cy={cy} glowR={glowR} />}
    </Animated.View>
  );
}

/** Misty cloud — wraps across screen, both clouds move in the same direction */
function MistyCloud({
  config,
  direction,
  screenWidth,
  progress,
  zIndex,
}: {
  config: ReturnType<typeof useCloudConfigs>['clouds'][number];
  direction: number;
  screenWidth: number;
  progress: SharedValue<number>;
  zIndex: number;
}) {
  const { scale, opacity, sprite, top: cloudTop, totalDist } = config;
  const w = 160 * scale;
  const h = 100 * scale;
  const pad = Math.max(w, h) * 0.25;
  const boxW = w + pad * 2;
  const boxH = h + pad * 2;

  // Start position: fully off-screen on one side
  const startX = direction > 0 ? -boxW : screenWidth;
  const travel = direction > 0 ? totalDist : -totalDist;

  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: startX + progress.value * travel }],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: cloudTop, width: boxW, height: boxH, zIndex }, moveStyle]}>
      {/* Sprite canvas is precomposed: cloud path × 4 mist layers + the
          vertical fade mask, in the exact 240:180 canvas proportions */}
      <Image source={sprite} style={[styles.sprite, styles.fill, { opacity }]} />
    </Animated.View>
  );
}

/** Animated spark particles that float around the moon glow */
function MoonSparks({ cx, cy, glowR }: { cx: number; cy: number; glowR: number }) {
  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const p3 = useSharedValue(0);
  const p4 = useSharedValue(0);
  const progress = [p0, p1, p2, p3, p4];

  // biome-ignore lint/correctness/useExhaustiveDependencies: progress array is re-created each render; its stable shared-value elements are the listed deps
  useEffect(() => {
    MOON_SPARKS.forEach((spark, i) => {
      progress[i].value = withDelay(
        spark.delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: spark.duration, easing: Easing.linear }),
            withTiming(0, { duration: 10 })
          ),
          -1
        )
      );
    });
  }, [p0, p1, p2, p3, p4]);

  return (
    <>
      {MOON_SPARKS.map((spark, i) => {
        const rad = (spark.angle * Math.PI) / 180;
        const sparkX = cx + Math.cos(rad) * glowR * spark.dist;
        const sparkY = cy + Math.sin(rad) * glowR * spark.dist;
        return (
          <SparkDot
            // biome-ignore lint/suspicious/noArrayIndexKey: MOON_SPARKS is a static decorative config, never reordered
            key={i}
            cx={sparkX}
            baseCy={sparkY}
            r={spark.size}
            drift={spark.drift}
            hot={spark.hot}
            progress={progress[i]}
          />
        );
      })}
    </>
  );
}

/** Animated spark particles that float around the lantern glow */
function LanternSparks({ cx, cy, glowR }: { cx: number; cy: number; glowR: number }) {
  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const p3 = useSharedValue(0);
  const p4 = useSharedValue(0);
  const p5 = useSharedValue(0);
  const p6 = useSharedValue(0);
  const p7 = useSharedValue(0);
  const progress = [p0, p1, p2, p3, p4, p5, p6, p7];

  // biome-ignore lint/correctness/useExhaustiveDependencies: progress array is re-created each render; its stable shared-value elements are the listed deps
  useEffect(() => {
    SPARKS.forEach((spark, i) => {
      progress[i].value = withDelay(
        spark.delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: spark.duration, easing: Easing.linear }),
            withTiming(0, { duration: 10 })
          ),
          -1
        )
      );
    });
  }, [p0, p1, p2, p3, p4, p5, p6, p7]);

  return (
    <>
      {SPARKS.map((spark, i) => {
        const rad = (spark.angle * Math.PI) / 180;
        const sparkX = cx + Math.cos(rad) * glowR * spark.dist;
        const sparkY = cy + Math.sin(rad) * glowR * spark.dist;
        return (
          <SparkDot
            // biome-ignore lint/suspicious/noArrayIndexKey: SPARKS is a static decorative config, never reordered
            key={i}
            cx={sparkX}
            baseCy={sparkY}
            r={spark.size}
            drift={spark.drift}
            hot={spark.hot}
            progress={progress[i]}
          />
        );
      })}
    </>
  );
}

/** Single spark particle — fades in/out and drifts upward (GPU-composited View) */
function SparkDot({
  cx,
  baseCy,
  r,
  drift,
  hot,
  progress,
}: {
  cx: number;
  baseCy: number;
  r: number;
  drift: number;
  hot: boolean;
  progress: SharedValue<number>;
}) {
  const diameter = r * 2;

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Fade in over first 30%, fade out over remaining 70%
    const opacity = p < 0.3 ? (p / 0.3) * 0.85 : ((1 - p) / 0.7) * 0.85;
    return {
      opacity,
      transform: [{ translateY: -p * drift }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: cx - r,
          top: baseCy - r,
          width: diameter,
          height: diameter,
          borderRadius: r,
          backgroundColor: hot ? SPARK_COLOR_HOT : SPARK_COLOR,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sprite: {
    // Sprites carry their own alpha; never let the image view add tint or fade
    resizeMode: 'stretch',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  // scaleY must pivot at the wire's attachment point (top), not the center
  wireOrigin: {
    transformOrigin: ['50%', '0%'],
  } as const,
});
