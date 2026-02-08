import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
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
  // Midground star (left) — slow, wide sway
  {
    xPct: 0.26,
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
  // Background star (far right) — quick, shallow bounce
  {
    xPct: 0.87,
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

/** Misty cloud configs — two clouds at different sizes for depth */
const CLOUDS = [
  // Smaller cloud — left side near moon
  { xPct: 0.14, yOffset: 53, scale: 0.6, opacity: 0.22, fill: '#4a3d7a', driftDuration: 50000, driftAmount: 30 },
  // Large cloud — right side near right star
  { xPct: 0.88, yOffset: 60, scale: 0.85, opacity: 0.3, fill: '#3d3270', driftDuration: 40000, driftAmount: 27 },
] as const;

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

  // Cloud drift
  const cloudDrift0 = useSharedValue(0);
  const cloudDrift1 = useSharedValue(0);
  const cloudDrifts = [cloudDrift0, cloudDrift1];

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

    // Cloud drift — slow horizontal oscillation
    CLOUDS.forEach((cloud, i) => {
      cloudDrifts[i].value = withRepeat(
        withSequence(
          withTiming(cloud.driftAmount, { duration: cloud.driftDuration / 2, easing: ease }),
          withTiming(-cloud.driftAmount, { duration: cloud.driftDuration / 2, easing: ease })
        ),
        -1,
        true
      );
    });

    // Moon gentle bob
    moonBob.value = withRepeat(
      withSequence(withTiming(7, { duration: 4500, easing: ease }), withTiming(0, { duration: 4500, easing: ease })),
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
  }, [bob0, bob1, bob2, cloudDrift0, cloudDrift1, glow0, glow1, glow2, lanternFlicker, maxStarY, moonBob, moonGlowOpacity]);

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

      {/* zIndex 1: Back cloud (small, left side) */}
      <MistyCloud
        config={CLOUDS[0]}
        screenWidth={width}
        insetTop={insetTop}
        drift={cloudDrifts[0]}
        zIndex={1}
      />

      {/* zIndex 2: Front cloud (large, right side) */}
      <MistyCloud
        config={CLOUDS[1]}
        screenWidth={width}
        insetTop={insetTop}
        drift={cloudDrifts[1]}
        zIndex={2}
      />

      {/* zIndex 3: Moon — in front of clouds */}
      <FloatingMoon
        cx={moonCx}
        cy={moonCy}
        r={moonR}
        glowR={moonGlowR}
        svgSize={moonSvgSize}
        bobOffset={moonBob}
        glowOpacity={moonGlowOpacity}
        zIndex={3}
      />

      {/* zIndex 4: Left star — in front of clouds */}
      <FloatingStar
        index={0}
        x={width * HANGINGS[0].xPct}
        lineLen={HANGINGS[0].lineLen * vScale}
        size={HANGINGS[0].size}
        type={HANGINGS[0].type}
        bobOffset={bobs[0]}
        glowOpacity={glows[0]}
        bodyOpacity={HANGINGS[0].bodyOpacity}
        zIndex={4}
      />

      {/* zIndex 5: Right star — in front of clouds */}
      <FloatingStar
        index={2}
        x={width * HANGINGS[2].xPct}
        lineLen={HANGINGS[2].lineLen * vScale}
        size={HANGINGS[2].size}
        type={HANGINGS[2].type}
        bobOffset={bobs[2]}
        glowOpacity={glows[2]}
        bodyOpacity={HANGINGS[2].bodyOpacity}
        zIndex={5}
      />

      {/* zIndex 6: Lantern — in front of everything */}
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
        zIndex={6}
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
      style={[{ position: 'absolute', left: cx - glowR, top: cy - glowR, width: svgSize, height: svgSize, zIndex }, moveStyle]}>
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
 * Cloud SVG path in a 160×100 viewBox.
 * Bumpy top (arcs), flat bottom — narrower cloud silhouette.
 */
const CLOUD_PATH =
  'M 24,70 Q 8,70 8,55 Q 8,40 24,38 Q 26,18 44,18 Q 58,10 72,22 Q 84,8 104,18 Q 124,5 136,22 Q 152,18 154,40 Q 160,45 160,55 Q 160,70 144,70 Z';

// Misty layers: each rendered at increasing scale + decreasing opacity
const CLOUD_MIST_LAYERS = [
  { scale: 1.0, opacityMul: 1.0 },
  { scale: 1.12, opacityMul: 0.5 },
  { scale: 1.25, opacityMul: 0.22 },
  { scale: 1.4, opacityMul: 0.08 },
];


/** Misty cloud — SVG cloud path rendered in layered scales for soft feathered edges */
function MistyCloud({
  config,
  screenWidth,
  insetTop,
  drift,
  zIndex,
}: {
  config: (typeof CLOUDS)[number];
  screenWidth: number;
  insetTop: number;
  drift: SharedValue<number>;
  zIndex: number;
}) {
  const { xPct, yOffset, scale, opacity, fill } = config;
  // Base viewBox is 160×100; scale it up
  const w = 160 * scale;
  const h = 100 * scale;
  // Extra padding for mist layers (largest layer is 1.4× base)
  const pad = Math.max(w, h) * 0.25;
  const svgW = w + pad * 2;
  const svgH = h + pad * 2;
  const left = screenWidth * xPct - svgW / 2;
  const top = insetTop + yOffset - svgH / 2;

  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }],
  }));

  const fadeMaskId = `cloudFade${zIndex}`;

  return (
    <Animated.View
      style={[{ position: 'absolute', left, top, width: svgW, height: svgH, zIndex }, driftStyle]}>
      <Svg width={svgW} height={svgH}>
        <Defs>
          {/* Vertical fade — fully visible top half, fades to transparent at bottom */}
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
              <G key={i} transform={`translate(${lx}, ${ly}) scale(${(lw / 160).toFixed(3)}, ${(lh / 100).toFixed(3)})`}>
                <Path d={CLOUD_PATH} fill={fill} opacity={opacity * layer.opacityMul} />
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
