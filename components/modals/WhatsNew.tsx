import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { getPlatformBadges, groupWhatsNewItems, type WhatsNewItem } from '@/shared/whatsNew';

import Modal from './Modal';

const BADGE_GLYPH: Record<string, Icon> = {
  iOS: Icon.APPLE,
  Android: Icon.ANDROID,
};

/** De-emphasized faint blue - platform notes, badges and separator dots */
const FAINT_BLUE = 'rgba(42, 68, 130, 0.32)';

/** The pill's tonal wash - the group key's own colour as a fill */
const GROUP_KEY_WASH = 'rgba(52, 78, 92, 0.14)';

/** Bounds the changelog so the card's heading and Close always fit beside it */
const LIST_HEIGHT_SHARE = 0.62;

type Props = {
  visible: boolean;
  items: WhatsNewItem[];
  onClose: () => void;
};

export default function ModalWhatsNew({ visible, items, onClose }: Props) {
  const { height } = useWindowDimensions();
  const groups = groupWhatsNewItems(items);

  return (
    <Modal visible={visible} title={t('whatsNew.heading')} onRequestClose={onClose}>
      <ScrollView
        style={[styles.list, { maxHeight: height * LIST_HEIGHT_SHARE }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {groups.map((group, groupIndex) => (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupKey}>{group.key}</Text>
            </View>
            {group.items.map((item) => (
              <View key={item.title} style={styles.item}>
                <View style={styles.itemText}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body}>
                    {item.body}
                    {item.platform && (
                      <Text style={styles.bodyPlatform}>
                        {t('whatsNew.platformNote', { platform: item.platform === 'ios' ? 'iOS' : 'Android' })}
                      </Text>
                    )}
                  </Text>
                </View>
                {/* Platform availability glyphs at the row's trailing edge, level
                    with the title: the badge is the information */}
                <View style={styles.badges}>
                  {getPlatformBadges(item).map((badge) => (
                    <IconView
                      key={badge}
                      type={BADGE_GLYPH[badge]}
                      size={badge === 'iOS' ? 10 : 13}
                      color={FAINT_BLUE}
                    />
                  ))}
                </View>
              </View>
            ))}
            {groupIndex < groups.length - 1 ? (
              <View style={styles.separator}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <Pressable
        style={styles.button}
        onPress={onClose}
        accessibilityRole={'button'}
        accessibilityLabel={t('modal.close')}>
        <Text style={styles.buttonText}>{t('modal.close')}</Text>
      </Pressable>
    </Modal>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  list: {
    width: '100%',
    marginBottom: 36,
  },
  // The rhythm rides on the groups and rows: a ScrollView's own style never spaces its children
  listContent: {
    paddingTop: SPACING.xxs,
  },
  group: {
    marginBottom: SPACING.md,
  },
  groupHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    marginBottom: SPACING.smd,
  },
  groupKey: {
    borderRadius: RADIUS.sm,
    backgroundColor: GROUP_KEY_WASH,
    paddingHorizontal: 7,
    paddingVertical: 2,
    color: COLORS.light.textSecondary,
    fontSize: ty.size(10),
    lineHeight: ty.size(12),
    fontFamily: ty.familyMedium,
    letterSpacing: ty.letterSpacing(TEXT.letterSpacing.default),
    overflow: 'hidden',
  },
  separator: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 7,
    backgroundColor: FAINT_BLUE,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  itemText: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.quart,
    marginStart: SPACING.sm,
    marginTop: SPACING.xs,
  },
  title: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: COLORS.light.text,
    letterSpacing: ty.letterSpacing(TEXT.letterSpacing.default),
  },
  body: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.light.textSecondary,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    letterSpacing: ty.letterSpacing(TEXT.letterSpacing.default),
    marginTop: 2,
  },
  bodyPlatform: {
    color: FAINT_BLUE,
  },
  button: {
    width: SIZE.modal.buttonWidth,
    alignSelf: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light.buttonPrimary,
  },
  buttonText: {
    color: COLORS.light.background,
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
  },
});
