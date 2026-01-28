import { StyleSheet, Text, View } from 'react-native';

import { TEXT, SPACING, RADIUS } from '@/shared/constants';

interface BottomSheetHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

/**
 * Shared header component for bottom sheets.
 *
 * Features:
 * - Consistent styling across all bottom sheets
 * - Title and subtitle text
 * - Icon container with indigo background
 *
 * @example
 * <BottomSheetHeader
 *   title="Settings"
 *   subtitle="Set your preferences"
 *   icon={<SettingsIcon width={16} height={16} color="rgba(165, 180, 252, 0.8)" />}
 * />
 */
export default function BottomSheetHeader({ title, subtitle, icon }: BottomSheetHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.headerIcon}>{icon}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: TEXT.family.medium,
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: SPACING.xxs,
  },
  subtitle: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
    marginTop: SPACING.xs,
  },
});
