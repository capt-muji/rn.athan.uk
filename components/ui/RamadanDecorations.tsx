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
import Svg, { Circle, Defs, G, Line, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { isRamadan } from '@/shared/time';
import { decorationsEnabledAtom } from '@/stores/ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// --- Colors (tuned for #031a4c → #5b1eaa background) ---
const COLOR = '#FFC947';
const GLOW_CENTER = '#FFECB3';
const GLOW_MID = '#FFD54F';
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
  // Midground star (left)
  {
    xPct: 0.28,
    lineLen: 77,
    size: 6.6,
    bobDuration: 4500,
    glowDelay: 800,
    dropFraction: 0.7,
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
    lineLen: 115,
    size: 7.2,
    bobDuration: 3200,
    glowDelay: 1600,
    dropFraction: 1.0,
    type: 'lantern',
    threadWidth: 0.7,
    threadOpacity: 0.14,
    bodyOpacity: 1,
    glowMin: 0.5,
    glowMax: 0.9,
  },
  // Background star (far right) — most subtle
  {
    xPct: 0.9,
    lineLen: 88,
    size: 5.3,
    bobDuration: 5800,
    glowDelay: 400,
    dropFraction: 0.5,
    type: 'star',
    threadWidth: 0.35,
    threadOpacity: 0.04,
    bodyOpacity: 1,
    glowMin: 0.3,
    glowMax: 0.55,
  },
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

  // Moon motion
  const moonBob = useSharedValue(0);
  const moonGlowOpacity = useSharedValue(0);

  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);

  // Android height includes nav bar — scale down vertical positions
  const vScale = Platform.OS === 'android' ? 0.6 : 1;
  const svgHeight = height * 0.385 * vScale;
  const moonCx = width * 0.13;
  const moonCy = insetTop + 76;
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
  }, [bob0, bob1, bob2, glow0, glow1, glow2, maxStarY, moonBob, moonGlowOpacity]);

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

      {/* Moon body + glow as Animated.View (translateY for bob) */}
      <FloatingMoon
        cx={moonCx}
        cy={moonCy}
        r={moonR}
        glowR={moonGlowR}
        svgSize={moonSvgSize}
        bobOffset={moonBob}
        glowOpacity={moonGlowOpacity}
      />

      {/* Stars + glows as Animated.Views (translateY actually works here) */}
      {HANGINGS.map((star, i) => (
        <FloatingStar
          key={i}
          index={i}
          x={width * star.xPct}
          lineLen={star.lineLen * vScale}
          size={star.size}
          type={star.type}
          bobOffset={bobs[i]}
          glowOpacity={glows[i]}
          bodyOpacity={star.bodyOpacity}
        />
      ))}
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
}: {
  cx: number;
  cy: number;
  r: number;
  glowR: number;
  svgSize: number;
  bobOffset: SharedValue<number>;
  glowOpacity: SharedValue<number>;
}) {
  const localCx = glowR;
  const localCy = glowR;

  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }],
  }));

  const glowProps = useAnimatedProps(() => ({ opacity: glowOpacity.value }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: cx - glowR, top: cy - glowR, width: svgSize, height: svgSize }, moveStyle]}>
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={GLOW_MID} stopOpacity={0.4} />
            <Stop offset="15%" stopColor={COLOR} stopOpacity={0.25} />
            <Stop offset="35%" stopColor={COLOR} stopOpacity={0.12} />
            <Stop offset="65%" stopColor={COLOR} stopOpacity={0.03} />
            <Stop offset="100%" stopColor={COLOR} stopOpacity={0} />
          </RadialGradient>
          <Mask id="crescentMask">
            <Rect x={0} y={0} width={svgSize} height={svgSize} fill="black" />
            <Circle cx={localCx} cy={localCy} r={r} fill="white" />
            <Circle cx={localCx + 5} cy={localCy - 5} r={r * 0.92} fill="black" />
          </Mask>
        </Defs>

        <AnimatedCircle cx={localCx - 6} cy={localCy + 4} r={glowR} fill="url(#moonGlow)" animatedProps={glowProps} />
        <Circle cx={localCx} cy={localCy} r={r} fill={COLOR} opacity={1} mask="url(#crescentMask)" />
      </Svg>
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
  x,
  lineLen,
  size,
  type,
  bobOffset,
  glowOpacity,
  bodyOpacity,
}: {
  index: number;
  x: number;
  lineLen: number;
  size: number;
  type: 'star' | 'lantern';
  bobOffset: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  bodyOpacity: number;
}) {
  const visualSize = type === 'lantern' ? size * 1.5 : size;
  const glowR = visualSize * 4;
  const baseStarY = lineLen + size; // attachment point stays based on original size
  const svgSize = glowR * 2;
  const gradientId = `starGlow${index}`;
  const cx = glowR;
  const cy = glowR;

  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }],
  }));

  const glowProps = useAnimatedProps(() => ({ opacity: glowOpacity.value }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x - glowR, top: baseStarY - glowR, width: svgSize, height: svgSize },
        moveStyle,
      ]}>
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={GLOW_CENTER} stopOpacity={1} />
            <Stop offset="8%" stopColor={GLOW_MID} stopOpacity={0.75} />
            <Stop offset="18%" stopColor={COLOR} stopOpacity={0.4} />
            <Stop offset="40%" stopColor={COLOR} stopOpacity={0.15} />
            <Stop offset="70%" stopColor={COLOR} stopOpacity={0.04} />
            <Stop offset="100%" stopColor={COLOR} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <AnimatedCircle cx={cx} cy={cy} r={glowR} fill={`url(#${gradientId})`} animatedProps={glowProps} />
        {type === 'lantern' ? (
          <G
            transform={`translate(${cx - (visualSize * 3.6) / 2}, ${cy - (visualSize * 3.6) / 2}) scale(${(visualSize * 3.6) / 396.586})`}
            opacity={bodyOpacity}>
            <Path
              d="M281.603,179.637c0.828,0,1.5-0.671,1.5-1.5v-4.601h4.451c0.828,0,1.5-0.671,1.5-1.5v-9.699c0-0.829-0.672-1.5-1.5-1.5h-24.146c-3.842-27.97-40.149-45.072-56.818-51.509c0.26-0.794,0.404-1.637,0.404-2.515c0-3.405-2.109-6.332-5.133-7.646c1.078-0.939,1.76-2.294,1.76-3.806c0-1.994-1.182-3.722-2.906-4.57l-0.781-6.204c3.354-0.748,5.861-3.736,5.861-7.315v-0.5c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.5c0,3.579,2.508,6.567,5.861,7.315l-0.781,6.204c-1.725,0.849-2.906,2.576-2.906,4.57c0,1.512,0.682,2.866,1.758,3.806c-3.021,1.313-5.131,4.24-5.131,7.646c0,0.877,0.144,1.721,0.404,2.515c-16.67,6.437-52.977,23.539-56.818,51.509h-24.148c-0.828,0-1.5,0.671-1.5,1.5v9.699c0,0.829,0.672,1.5,1.5,1.5h4.451v4.601c0,0.829,0.672,1.5,1.5,1.5h3.271v162.282h-3.271c-0.828,0-1.5,0.671-1.5,1.5v4.598h-4.451c-0.828,0-1.5,0.671-1.5,1.5v9.702c0,0.829,0.672,1.5,1.5,1.5h32.018c17.57,23.99,57.244,35.867,57.244,35.867s39.674-11.877,57.244-35.867h32.016c0.828,0,1.5-0.671,1.5-1.5v-9.702c0-0.829-0.672-1.5-1.5-1.5h-4.451v-4.598c0-0.829-0.672-1.5-1.5-1.5h-3.27V179.637H281.603z M161.343,331.651h-26.795V228.584c0-24.726,13.396-40.929,13.396-40.929s13.398,16.203,13.398,40.929V331.651z M221.644,331.651h-46.701V228.584c0-24.726,23.352-40.929,23.352-40.929s23.35,16.203,23.35,40.929V331.651z M262.04,331.651h-26.795V228.584c0-24.726,13.396-40.929,13.396-40.929s13.398,16.203,13.398,40.929V331.651z"
              fill={COLOR}
            />
            <Path
              d="M198.294,39.054c4.143,0,7.5-3.358,7.5-7.5v-0.963c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.963C190.794,35.695,194.151,39.054,198.294,39.054z"
              fill={COLOR}
            />
            <Path
              d="M198.294,15.962c4.143,0,7.5-3.357,7.5-7.5V7.5c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.962C190.794,12.604,194.151,15.962,198.294,15.962z"
              fill={COLOR}
            />
            <Path
              d="M198.294,62.145c4.143,0,7.5-3.358,7.5-7.5v-0.962c0-4.142-3.357-7.5-7.5-7.5c-4.143,0-7.5,3.358-7.5,7.5v0.962C190.794,58.786,194.151,62.145,198.294,62.145z"
              fill={COLOR}
            />
          </G>
        ) : (
          <Path d={fivePointStar(cx, cy, visualSize, visualSize * 0.4)} fill={COLOR} opacity={bodyOpacity} />
        )}
      </Svg>
    </Animated.View>
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
