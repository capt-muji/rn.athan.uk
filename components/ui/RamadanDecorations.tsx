import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { isRamadan } from '@/shared/time';
import { decorationsEnabledAtom } from '@/stores/ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// --- Colors (tuned for #031a4c → #5b1eaa background) ---
const MOON_COLOR = '#FFC947';
const MOON_GLOW_MID = '#FFD54F';
const THREAD_COLOR = '#C9A87C';
const GLOW_PULSE_DURATION = 3000;

// Lantern palette (gold body + warm candle glow)
const LANTERN_COLOR = '#FFC947';
const LANTERN_GLOW_CENTER = '#FFECB3';
const LANTERN_GLOW_MID = '#FFD54F';
const LANTERN_FLICKER_CENTER = '#FFF3E0'; // warm white core
const LANTERN_FLICKER_MID = '#FFAB40'; // deep amber edge

// Star palette (gold, matching moon/lantern)
const STAR_COLOR = '#FFC947';
const STAR_GLOW_CENTER = '#FFECB3';
const STAR_GLOW_MID = '#FFD54F';

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

/** Cloud fill colors */
// Cloud fills — all close to background (#031a4c → #5b1eaa), darker = more distant
const CLOUD_FILLS = ['#2b1d5e', '#2e2068', '#212367'] as const;

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
          fill: CLOUD_FILLS[0],
          top: smallCloudTop,
          totalDist: screenWidth + smallW,
          duration: baseDuration,
          path: CLOUD_PATH_REAR,
          startPos: startPos[0],
        },
        // Large (mid) cloud
        {
          scale: largeScale,
          opacity: opacityFor(largeH),
          fill: CLOUD_FILLS[1],
          top: largeCloudTop,
          totalDist: screenWidth + largeW,
          duration: baseDuration * 0.85,
          path: CLOUD_PATH_FRONT,
          startPos: startPos[1],
        },
        // Top (largest) cloud — 1.5× large, highest position
        {
          scale: topScale,
          opacity: opacityFor(topH),
          fill: CLOUD_FILLS[2],
          top: topCloudTop,
          totalDist: screenWidth + topW,
          duration: baseDuration * 0.7,
          path: CLOUD_PATH_TOP,
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

  // Moon glow radius (determines Animated.View size)
  const moonGlowR = moonR * 2.5;
  const moonSvgSize = moonGlowR * 2;

  const moonBobMax = 7; // matches the withTiming(7, ...) in useEffect
  // Highest point any star reaches (smallest lineLen + size)
  const starHighestY = Math.min(...HANGINGS.filter((h) => h.type === 'star').map((h) => h.lineLen * vScale + h.size));
  const cloudConfig = useCloudConfigs(moonR, moonCy, moonBobMax, width, starHighestY);

  useEffect(() => {
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
  ]);

  if (!isRamadan() || !decorationsEnabled) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Main SVG: wires only (moon string + hanging wires) */}
      <Svg width={width} height={svgHeight} viewBox={`0 0 ${width} ${svgHeight}`}>
        {/* Moon string — animated to follow moon bob */}
        <MoonWire x={moonTipX} baseY={moonTipY} bobOffset={moonBob} />

        {HANGINGS.map((star, i) => (
          <HangingWire
            key={i}
            x={width * star.xPct}
            lineLen={star.lineLen * vScale}
            bobOffset={bobs[i]}
            strokeWidth={star.threadWidth}
            opacity={star.threadOpacity}
          />
        ))}
      </Svg>

      {/* zIndex 1: Moon */}
      <FloatingMoon
        cx={moonCx}
        cy={moonCy}
        r={moonR}
        glowR={moonGlowR}
        svgSize={moonSvgSize}
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

      {/* zIndex 4: Small cloud (back) — in front of stars/moon */}
      <MistyCloud
        config={cloudConfig.clouds[0]}
        direction={cloudConfig.direction}
        screenWidth={width}
        progress={cloudProgs[0]}
        zIndex={4}
      />

      {/* zIndex 5: Large cloud (mid) — in front of stars/moon */}
      <MistyCloud
        config={cloudConfig.clouds[1]}
        direction={cloudConfig.direction}
        screenWidth={width}
        progress={cloudProgs[1]}
        zIndex={5}
      />

      {/* zIndex 6: Top cloud (largest) — in front of stars/moon */}
      <MistyCloud
        config={cloudConfig.clouds[2]}
        direction={cloudConfig.direction}
        screenWidth={width}
        progress={cloudProgs[2]}
        zIndex={6}
      />

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

/** Moon wire — animated y2 follows bob */
function MoonWire({ x, baseY, bobOffset }: { x: number; baseY: number; bobOffset: SharedValue<number> }) {
  const lineProps = useAnimatedProps(() => ({ y2: baseY + bobOffset.value }));

  return (
    <AnimatedLine
      x1={x}
      y1={0}
      x2={x}
      stroke={THREAD_COLOR}
      strokeWidth={0.4}
      opacity={0.06}
      animatedProps={lineProps}
    />
  );
}

/** Moon crescent + glow — own Animated.View so translateY works */
function FloatingMoon({
  cx,
  cy,
  r,
  glowR,
  svgSize,
  bobOffset,
  glowOpacity,
  zIndex,
}: {
  cx: number;
  cy: number;
  r: number;
  glowR: number;
  svgSize: number;
  bobOffset: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  zIndex?: number;
}) {
  const localCx = glowR;
  const localCy = glowR;

  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }],
  }));

  const glowProps = useAnimatedProps(() => ({ opacity: glowOpacity.value }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: cx - glowR, top: cy - glowR, width: svgSize, height: svgSize, zIndex },
        moveStyle,
      ]}>
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={MOON_GLOW_MID} stopOpacity={0.4} />
            <Stop offset="15%" stopColor={MOON_COLOR} stopOpacity={0.25} />
            <Stop offset="35%" stopColor={MOON_COLOR} stopOpacity={0.12} />
            <Stop offset="65%" stopColor={MOON_COLOR} stopOpacity={0.03} />
            <Stop offset="100%" stopColor={MOON_COLOR} stopOpacity={0} />
          </RadialGradient>
          <Mask id="crescentMask">
            <Rect x={0} y={0} width={svgSize} height={svgSize} fill="black" />
            <Circle cx={localCx} cy={localCy} r={r} fill="white" />
            <Circle cx={localCx + 5} cy={localCy - 5} r={r * 0.92} fill="black" />
          </Mask>
        </Defs>

        <AnimatedCircle cx={localCx - 6} cy={localCy + 4} r={glowR} fill="url(#moonGlow)" animatedProps={glowProps} />
        <Circle cx={localCx} cy={localCy} r={r} fill={MOON_COLOR} opacity={1} mask="url(#crescentMask)" />
      </Svg>
      <MoonSparks cx={localCx - 6} cy={localCy + 4} glowR={glowR * 0.6} />
    </Animated.View>
  );
}

/** Wire only — stays in the main SVG, y2 animated to follow star */
function HangingWire({
  x,
  lineLen,
  bobOffset,
  strokeWidth,
  opacity,
}: {
  x: number;
  lineLen: number;
  bobOffset: SharedValue<number>;
  strokeWidth: number;
  opacity: number;
}) {
  const lineProps = useAnimatedProps(() => ({ y2: lineLen + bobOffset.value }));

  return (
    <AnimatedLine
      x1={x}
      y1={0}
      x2={x}
      stroke={THREAD_COLOR}
      strokeWidth={strokeWidth}
      opacity={opacity}
      animatedProps={lineProps}
    />
  );
}

/** Star/lantern shape + glow — Animated.View with translateY for reliable movement */
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
  const svgSize = glowR * 2;
  const gradientId = `starGlow${index}`;
  const cx = glowR;
  const cy = glowR;
  const isStarType = type === 'star';

  const moveStyle = useAnimatedStyle(() => ({
    transform: isStarType
      ? [{ translateY: bobOffset.value }, { scale: 0.7 + glowOpacity.value * 0.5 }]
      : [{ translateY: bobOffset.value }],
  }));

  const glowProps = useAnimatedProps(() => ({ opacity: glowOpacity.value }));
  const flickerProps = useAnimatedProps(() => ({
    opacity: flickerOpacity ? flickerOpacity.value : 0,
  }));

  const flickerGradientId = `flickerGlow${index}`;

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x - glowR, top: baseStarY - glowR, width: svgSize, height: svgSize, zIndex },
        moveStyle,
      ]}>
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={type === 'lantern' ? LANTERN_GLOW_CENTER : STAR_GLOW_CENTER} stopOpacity={1} />
            <Stop offset="8%" stopColor={type === 'lantern' ? LANTERN_GLOW_MID : STAR_GLOW_MID} stopOpacity={0.75} />
            <Stop offset="18%" stopColor={type === 'lantern' ? LANTERN_COLOR : STAR_COLOR} stopOpacity={0.4} />
            <Stop offset="40%" stopColor={type === 'lantern' ? LANTERN_COLOR : STAR_COLOR} stopOpacity={0.15} />
            <Stop offset="70%" stopColor={type === 'lantern' ? LANTERN_COLOR : STAR_COLOR} stopOpacity={0.04} />
            <Stop offset="100%" stopColor={type === 'lantern' ? LANTERN_COLOR : STAR_COLOR} stopOpacity={0} />
          </RadialGradient>
          {type === 'lantern' && (
            <RadialGradient id={flickerGradientId} cx="50%" cy="55%" r="35%">
              <Stop offset="0%" stopColor={LANTERN_FLICKER_CENTER} stopOpacity={0.9} />
              <Stop offset="30%" stopColor={LANTERN_GLOW_MID} stopOpacity={0.5} />
              <Stop offset="60%" stopColor={LANTERN_FLICKER_MID} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={LANTERN_FLICKER_MID} stopOpacity={0} />
            </RadialGradient>
          )}
        </Defs>
        <AnimatedCircle cx={cx} cy={cy} r={glowR} fill={`url(#${gradientId})`} animatedProps={glowProps} />
        {type === 'lantern' && (
          <AnimatedCircle
            cx={cx}
            cy={cy + visualSize * 0.3}
            r={glowR * 0.45}
            fill={`url(#${flickerGradientId})`}
            animatedProps={flickerProps}
          />
        )}
        {type === 'lantern' ? (
          <G
            transform={`translate(${cx - (visualSize * 3.6) / 2}, ${cy - (visualSize * 3.6) / 2}) scale(${(visualSize * 3.6) / 396.586})`}
            opacity={bodyOpacity}>
            <Path
              d="M281.603,179.637c0.828,0,1.5-0.671,1.5-1.5v-4.601h4.451c0.828,0,1.5-0.671,1.5-1.5v-9.699c0-0.829-0.672-1.5-1.5-1.5h-24.146c-3.842-27.97-40.149-45.072-56.818-51.509c0.26-0.794,0.404-1.637,0.404-2.515c0-3.405-2.109-6.332-5.133-7.646c1.078-0.939,1.76-2.294,1.76-3.806c0-1.994-1.182-3.722-2.906-4.57l-0.781-6.204c3.354-0.748,5.861-3.736,5.861-7.315v-0.5c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.5c0,3.579,2.508,6.567,5.861,7.315l-0.781,6.204c-1.725,0.849-2.906,2.576-2.906,4.57c0,1.512,0.682,2.866,1.758,3.806c-3.021,1.313-5.131,4.24-5.131,7.646c0,0.877,0.144,1.721,0.404,2.515c-16.67,6.437-52.977,23.539-56.818,51.509h-24.148c-0.828,0-1.5,0.671-1.5,1.5v9.699c0,0.829,0.672,1.5,1.5,1.5h4.451v4.601c0,0.829,0.672,1.5,1.5,1.5h3.271v162.282h-3.271c-0.828,0-1.5,0.671-1.5,1.5v4.598h-4.451c-0.828,0-1.5,0.671-1.5,1.5v9.702c0,0.829,0.672,1.5,1.5,1.5h32.018c17.57,23.99,57.244,35.867,57.244,35.867s39.674-11.877,57.244-35.867h32.016c0.828,0,1.5-0.671,1.5-1.5v-9.702c0-0.829-0.672-1.5-1.5-1.5h-4.451v-4.598c0-0.829-0.672-1.5-1.5-1.5h-3.27V179.637H281.603z M161.343,331.651h-26.795V228.584c0-24.726,13.396-40.929,13.396-40.929s13.398,16.203,13.398,40.929V331.651z M221.644,331.651h-46.701V228.584c0-24.726,23.352-40.929,23.352-40.929s23.35,16.203,23.35,40.929V331.651z M262.04,331.651h-26.795V228.584c0-24.726,13.396-40.929,13.396-40.929s13.398,16.203,13.398,40.929V331.651z"
              fill={LANTERN_COLOR}
            />
            <Path
              d="M198.294,39.054c4.143,0,7.5-3.358,7.5-7.5v-0.963c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.963C190.794,35.695,194.151,39.054,198.294,39.054z"
              fill={LANTERN_COLOR}
            />
            <Path
              d="M198.294,15.962c4.143,0,7.5-3.357,7.5-7.5V7.5c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.962C190.794,12.604,194.151,15.962,198.294,15.962z"
              fill={LANTERN_COLOR}
            />
            <Path
              d="M198.294,62.145c4.143,0,7.5-3.358,7.5-7.5v-0.962c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.962C190.794,58.786,194.151,62.145,198.294,62.145z"
              fill={LANTERN_COLOR}
            />
          </G>
        ) : (
          <Path d={fivePointStar(cx, cy, visualSize, visualSize * 0.4)} fill={STAR_COLOR} opacity={bodyOpacity} />
        )}
      </Svg>
      {type === 'lantern' && <LanternSparks cx={cx} cy={cy} glowR={glowR} />}
    </Animated.View>
  );
}

/**
 * Front cloud SVG path — 160×100 viewBox, bumpy top, flat bottom.
 */
const CLOUD_PATH_FRONT =
  'M 24,70 Q 8,70 8,55 Q 8,40 24,38 Q 26,18 44,18 Q 58,10 72,22 Q 84,8 104,18 Q 124,5 136,22 Q 152,18 154,40 Q 160,45 160,55 Q 160,70 144,70 Z';

/**
 * Rear cloud SVG path — 160×100 viewBox, wider/flatter silhouette, flat bottom.
 */
const CLOUD_PATH_REAR =
  'M 16,72 Q 4,72 4,60 Q 4,50 18,48 Q 20,34 40,30 Q 52,22 68,32 Q 82,20 100,28 Q 116,18 132,30 Q 146,26 150,42 Q 158,46 158,58 Q 158,72 142,72 Z';

/**
 * Top cloud SVG path — 160×100 viewBox, elongated/stretched shape, flat bottom.
 */
const CLOUD_PATH_TOP =
  'M 20,74 Q 6,74 6,62 Q 6,52 20,50 Q 24,38 42,34 Q 56,26 74,36 Q 88,24 108,34 Q 122,22 138,34 Q 148,30 152,44 Q 160,48 160,60 Q 160,74 144,74 Z';

// Misty layers: each rendered at increasing scale + decreasing opacity
const CLOUD_MIST_LAYERS = [
  { scale: 1.0, opacityMul: 1.0 },
  { scale: 1.12, opacityMul: 0.5 },
  { scale: 1.25, opacityMul: 0.22 },
  { scale: 1.4, opacityMul: 0.08 },
];

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
  const { scale, opacity, fill, top: cloudTop, totalDist, path } = config;
  const w = 160 * scale;
  const h = 100 * scale;
  const pad = Math.max(w, h) * 0.25;
  const svgW = w + pad * 2;
  const svgH = h + pad * 2;

  // Start position: fully off-screen on one side
  const startX = direction > 0 ? -svgW : screenWidth;
  const travel = direction > 0 ? totalDist : -totalDist;

  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: startX + progress.value * travel }],
  }));

  const fadeMaskId = `cloudFade${zIndex}`;

  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: cloudTop, width: svgW, height: svgH, zIndex }, moveStyle]}>
      <Svg width={svgW} height={svgH}>
        <Defs>
          <SvgLinearGradient id={fadeMaskId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="white" stopOpacity={1} />
            <Stop offset="55%" stopColor="white" stopOpacity={1} />
            <Stop offset="100%" stopColor="white" stopOpacity={0} />
          </SvgLinearGradient>
          <Mask id={`${fadeMaskId}m`}>
            <Rect x={0} y={0} width={svgW} height={svgH} fill={`url(#${fadeMaskId})`} />
          </Mask>
        </Defs>
        <G mask={`url(#${fadeMaskId}m)`}>
          {CLOUD_MIST_LAYERS.map((layer, i) => {
            const lw = w * layer.scale;
            const lh = h * layer.scale;
            const lx = (svgW - lw) / 2;
            const ly = (svgH - lh) / 2;
            return (
              <G
                key={i}
                transform={`translate(${lx}, ${ly}) scale(${(lw / 160).toFixed(3)}, ${(lh / 100).toFixed(3)})`}>
                <Path d={path} fill={fill} opacity={opacity * layer.opacityMul} />
              </G>
            );
          })}
        </G>
      </Svg>
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

/** Generates a 5-pointed star path centered at (cx, cy) */
function fivePointStar(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
    points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return `M${points[0]} L${points.slice(1).join(' L')} Z`;
}
