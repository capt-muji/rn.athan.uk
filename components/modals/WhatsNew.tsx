import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { getPlatformBadges, type WhatsNewItem } from '@/shared/whatsNew';

import Modal from './Modal';

const BADGE_GLYPH: Record<string, Icon> = {
  iOS: Icon.APPLE,
  Android: Icon.ANDROID,
};

type Props = {
  visible: boolean;
  /** Installed app version rendered under the title (never a hand-typed string) */
  version: string;
  items: WhatsNewItem[];
  onContinue: () => void;
};

export default function ModalWhatsNew({ visible, version, items, onContinue }: Props) {
  return (
    <Modal visible={visible} title="What's New">
      <Text style={styles.version}>Version {version}</Text>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.title} style={styles.item}>
            {/* Platform availability glyphs - filled, stacked, on white.
                Replaces the leading icon: the badge is the information. */}
            <View style={styles.badges}>
              {getPlatformBadges(item).map((badge) => (
                <IconView key={badge} type={BADGE_GLYPH[badge]} size={13} color={COLORS.light.text} />
              ))}
            </View>
            <View style={styles.itemText}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <Pressable style={styles.button} onPress={onContinue} accessibilityRole='button' accessibilityLabel='Continue'>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  version: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    textAlign: 'center',
    color: COLORS.light.textSecondary,
    lineHeight: TEXT.lineHeight.default,
    letterSpacing: TEXT.letterSpacing.default,
    marginBottom: SPACING.xl,
    marginTop: -SPACING.xs,
  },
  list: {
    width: '100%',
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  badges: {
    width: 24,
    alignItems: 'center',
    gap: 3,
  },
  itemText: {
    flex: 1,
  },
  title: {
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
    color: COLORS.light.text,
    letterSpacing: TEXT.letterSpacing.default,
  },
  body: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: COLORS.light.textSecondary,
    lineHeight: TEXT.lineHeight.default,
    letterSpacing: TEXT.letterSpacing.default,
    marginTop: 2,
  },
  button: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light.buttonPrimary,
  },
  buttonText: {
    color: COLORS.light.background,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
  },
});
