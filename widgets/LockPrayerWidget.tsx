import { HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  containerRelativeFrame,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactNode } from 'react';

import type { PrayerWidgetProps } from '@/shared/widgetTypes';

/**
 * Lock Screen widget layouts (accessoryRectangular + accessoryInline).
 * Accessories render in vibrant monochrome, so the system tints whatever
 * these set. The live faces read 17pt on layouts 1-2 and 16pt on layout 3,
 * each with a floor holding the worst case at or above the old 14pt nominal;
 * weight and opacity carry the hierarchy, and the SECOND reading on a line
 * is the muted one.
 * Three compositions per schedule, in gallery order: Layout 1 (name +
 * ticking countdown), Layout 2 (name + absolute time; no countdown and no
 * dot) and Layout 3 (name + absolute time with the
 * countdown beneath). Layouts 1 and 2 split the slot into halves meeting at
 * its midline: a timer Text reports a worst-case width as its intrinsic
 * size, so a shrink-wrapped row measures a reservation rather than the
 * glyphs and centring it strands the name at the slot's edge. Anchoring each
 * half at the seam holds the name's last letter and the second reading's
 * first character in place whatever their lengths. Layout 3 stacks instead,
 * so it centres by shrink-wrapping as usual. iOS 16 renders
 * containerRelativeFrame leading (the modifier needs 17), accepted on the
 * three-year-old floor. A timer Text stops ticking once concatenated, so the
 * inline faces carry the name and absolute time only, and every ticking
 * element is its own Text. The circular face stays unregistered since 1.14.1
 * (store builds carried it for ~a day; the orphan freeze risk was accepted
 * — see the retired ai/AGENTS.md, git history). All helpers must live inside each function: the
 * 'widget' directive serializes the body alone, and @expo/ui identifiers
 * resolve as globals in the extension's JS runtime.
 */
// Layout 1: the name beside a live countdown, no absolute time.
const AthanLockWidgetCountdownPair = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';

  // The neutral, stale and catch cards follow the device locale the widget
  // process itself reads (D44): absent props carry no app language. The
  // prefix match accepts region tags; anything unknown renders the en row.
  const STATIC = {
    en: {
      subtitle: 'Prayer times for London',
      inline: 'Athan — prayer times',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Open to load times',
      staleTitle: 'Out of date',
      staleBody: 'Open app to refresh',
      staleInline: 'Athan — open to refresh times',
      refreshLine: 'Open Athan to refresh',
      refreshLead: 'Open Athan',
      refreshTail: 'to refresh',
      catchBody: 'Open the app to refresh',
    },
    ar: {
      subtitle: 'أوقات الصلاة في لندن',
      inline: 'Athan - أوقات الصلاة',
      rectTitle: 'ATHAN',
      rectSubtitle: 'افتح لتحميل الأوقات',
      staleTitle: 'غير محدّث',
      staleBody: 'افتح التطبيق للتحديث',
      staleInline: 'Athan - افتح لتحديث الأوقات',
      refreshLine: 'افتح Athan للتحديث',
      refreshLead: 'افتح Athan',
      refreshTail: 'للتحديث',
      catchBody: 'افتح التطبيق للتحديث',
    },
    ms: {
      subtitle: 'Waktu solat untuk London',
      inline: 'Athan - waktu solat',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buka untuk muat waktu',
      staleTitle: 'Tidak dikemas kini',
      staleBody: 'Buka apl untuk muat semula',
      staleInline: 'Athan - buka untuk muat semula waktu',
      refreshLine: 'Buka Athan untuk muat semula',
      refreshLead: 'Buka Athan',
      refreshTail: 'untuk muat semula',
      catchBody: 'Buka aplikasi untuk muat semula',
    },
    so: {
      subtitle: 'Waqtiyada salaadda London',
      inline: 'Athan - waqtiyada salaadda',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Fur si aad u soo dejinto waqtiyada',
      staleTitle: "Cusboonaysi la'aan",
      staleBody: 'Fur aplka si aad u cusboonaysiiso',
      staleInline: 'Athan - fur si aad u cusboonaysiiso waqtiyada',
      refreshLine: 'Fur Athan si aad u cusboonaysiiso',
      refreshLead: 'Fur Athan',
      refreshTail: 'si aad u cusboonaysiiso',
      catchBody: 'Fur app-ka si aad u cusboonaysiiso',
    },
    hi: {
      subtitle: 'लंदन के नमाज़ के समय',
      inline: 'Athan - नमाज़ के समय',
      rectTitle: 'ATHAN',
      rectSubtitle: 'समय लोड करने के लिए खोलें',
      staleTitle: 'पुराना',
      staleBody: 'रिफ्रेश के लिए ऐप खोलें',
      staleInline: 'Athan - समय रिफ्रेश करने के लिए खोलें',
      refreshLine: 'रिफ्रेश के लिए Athan खोलें',
      refreshLead: 'Athan खोलें',
      refreshTail: 'रिफ्रेश के लिए',
      catchBody: 'रिफ्रेश के लिए ऐप खोलें',
    },
    th: {
      subtitle: 'เวลาละหมาดสำหรับลอนดอน',
      inline: 'Athan - เวลาละหมาด',
      rectTitle: 'ATHAN',
      rectSubtitle: 'เปิดเพื่อโหลดเวลา',
      staleTitle: 'ข้อมูลเก่า',
      staleBody: 'เปิดแอปเพื่อรีเฟรช',
      staleInline: 'Athan - เปิดเพื่อรีเฟรชเวลา',
      refreshLine: 'เปิด Athan เพื่อรีเฟรช',
      refreshLead: 'เปิด Athan',
      refreshTail: 'เพื่อรีเฟรช',
      catchBody: 'เปิดแอปเพื่อรีเฟรช',
    },
    id: {
      subtitle: 'Waktu salat untuk London',
      inline: 'Athan — waktu salat',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buka untuk memuat waktu',
      staleTitle: 'Kedaluwarsa',
      staleBody: 'Buka aplikasi untuk menyegarkan',
      staleInline: 'Athan — buka untuk menyegarkan waktu',
      refreshLine: 'Buka Athan untuk menyegarkan',
      refreshLead: 'Buka Athan',
      refreshTail: 'untuk menyegarkan',
      catchBody: 'Buka aplikasi untuk menyegarkan',
    },
    tr: {
      subtitle: 'Londra için namaz vakitleri',
      inline: 'Athan — namaz vakitleri',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vakitleri yüklemek için açın',
      staleTitle: 'Güncel değil',
      staleBody: 'Yenilemek için uygulamayı açın',
      staleInline: 'Athan — vakitleri yenilemek için açın',
      refreshLine: 'Yenilemek için Athan uygulamasını açın',
      refreshLead: 'Athan uygulamasını açın',
      refreshTail: 'yenilemek için',
      catchBody: 'Yenilemek için uygulamayı açın',
    },
    fr: {
      subtitle: 'Horaires de prière pour Londres',
      inline: 'Athan — horaires de prière',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Ouvrir pour charger les heures',
      staleTitle: 'Périmé',
      staleBody: "Ouvrir l'app pour actualiser",
      staleInline: 'Athan — ouvrir pour actualiser les heures',
      refreshLine: 'Ouvrir Athan pour actualiser',
      refreshLead: 'Ouvrir Athan',
      refreshTail: 'pour actualiser',
      catchBody: "Ouvrir l'application pour actualiser",
    },
    uz: {
      subtitle: 'London uchun namoz vaqtlari',
      inline: 'Athan — namoz vaqtlari',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vaqtlarni yuklash uchun oching',
      staleTitle: 'Eskirgan',
      staleBody: 'Yangilash uchun ilovani oching',
      staleInline: 'Athan — vaqtlarni yangilash uchun oching',
      refreshLine: 'Yangilash uchun Athan ilovasini oching',
      refreshLead: 'Athan ilovasini oching',
      refreshTail: 'yangilash uchun',
      catchBody: 'Yangilash uchun ilovani oching',
    },
    sw: {
      subtitle: 'Nyakati za swala London',
      inline: 'Athan — nyakati za swala',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Fungua kupakia nyakati',
      staleTitle: 'Haijasasishwa',
      staleBody: 'Fungua programu kusasisha',
      staleInline: 'Athan — fungua kusasisha nyakati',
      refreshLine: 'Fungua Athan kusasisha',
      refreshLead: 'Fungua Athan',
      refreshTail: 'kusasisha',
      catchBody: 'Fungua programu kusasisha',
    },
    ha: {
      subtitle: 'Lokutan salla London',
      inline: 'Athan — lokutan salla',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buɗe don ɗora lokuta',
      staleTitle: 'Ba a sabunta ba',
      staleBody: 'Buɗe app ɗin don sabuntawa',
      staleInline: 'Athan — buɗe don sabunta lokuta',
      refreshLine: 'Buɗe Athan don sabuntawa',
      refreshLead: 'Buɗe Athan',
      refreshTail: 'don sabuntawa',
      catchBody: 'Buɗe app ɗin don sabuntawa',
    },
    pt: {
      subtitle: 'Horários de oração para Londres',
      inline: 'Athan — horários de oração',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Abrir para carregar horários',
      staleTitle: 'Desatualizado',
      staleBody: 'Abrir o app para atualizar',
      staleInline: 'Athan — abrir para atualizar horários',
      refreshLine: 'Abrir Athan para atualizar',
      refreshLead: 'Abrir Athan',
      refreshTail: 'para atualizar',
      catchBody: 'Abrir o aplicativo para atualizar',
    },
    ur: {
      subtitle: 'لندن کے نماز کے اوقات',
      inline: 'Athan — اوقاتِ نماز',
      rectTitle: 'ATHAN',
      rectSubtitle: 'اوقات لوڈ کرنے کے لیے کھولیں',
      staleTitle: 'تازہ نہیں',
      staleBody: 'تازہ کاری کے لیے ایپ کھولیں',
      staleInline: 'Athan — اوقات تازہ کرنے کے لیے کھولیں',
      refreshLine: 'تازہ کاری کے لیے Athan کھولیں',
      refreshLead: 'Athan کھولیں',
      refreshTail: 'تازہ کاری کے لیے',
      catchBody: 'تازہ کاری کے لیے ایپ کھولیں',
    },
    fa: {
      subtitle: 'اوقات نماز لندن',
      inline: 'Athan — اوقات نماز',
      rectTitle: 'ATHAN',
      rectSubtitle: 'برای بارگیری اوقات باز کنید',
      staleTitle: 'به‌روز نیست',
      staleBody: 'برای به‌روزرسانی برنامه را باز کنید',
      staleInline: 'Athan — برای به‌روزرسانی اوقات باز کنید',
      refreshLine: 'برای به‌روزرسانی Athan را باز کنید',
      refreshLead: 'Athan را باز کنید',
      refreshTail: 'برای به‌روزرسانی',
      catchBody: 'برای به‌روزرسانی برنامه را باز کنید',
    },
    bn: {
      subtitle: 'লন্ডনের নামাজের সময়',
      inline: 'Athan — নামাজের সময়',
      rectTitle: 'ATHAN',
      rectSubtitle: 'সময় লোড করতে খুলুন',
      staleTitle: 'পুরোনো',
      staleBody: 'রিফ্রেশ করতে অ্যাপ খুলুন',
      staleInline: 'Athan — সময় রিফ্রেশ করতে খুলুন',
      refreshLine: 'রিফ্রেশ করতে Athan খুলুন',
      refreshLead: 'Athan খুলুন',
      refreshTail: 'রিফ্রেশ করতে',
      catchBody: 'রিফ্রেশ করতে অ্যাপটি খুলুন',
    },
    ru: {
      subtitle: 'Времена намаза для Лондона',
      inline: 'Athan — времена намаза',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Откройте, чтобы загрузить времена',
      staleTitle: 'Устарело',
      staleBody: 'Откройте приложение, чтобы обновить',
      staleInline: 'Athan — откройте, чтобы обновить времена',
      refreshLine: 'Откройте Athan, чтобы обновить',
      refreshLead: 'Откройте Athan',
      refreshTail: 'чтобы обновить',
      catchBody: 'Откройте приложение, чтобы обновить',
    },
    az: {
      subtitle: 'London üçün namaz vaxtları',
      inline: 'Athan — namaz vaxtları',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vaxtları yükləmək üçün açın',
      staleTitle: 'Güncəl deyil',
      staleBody: 'Yeniləmək üçün tətbiqi açın',
      staleInline: 'Athan — vaxtları yeniləmək üçün açın',
      refreshLine: 'Yeniləmək üçün Athan tətbiqini açın',
      refreshLead: 'Athan tətbiqini açın',
      refreshTail: 'yeniləmək üçün',
      catchBody: 'Yeniləmək üçün tətbiqi açın',
    },
    de: {
      subtitle: 'Gebetszeiten für London',
      inline: 'Athan — Gebetszeiten',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Zum Laden der Zeiten öffnen',
      staleTitle: 'Nicht aktuell',
      staleBody: 'App öffnen zum Aktualisieren',
      staleInline: 'Athan — öffnen zum Aktualisieren',
      refreshLine: 'Athan öffnen zum Aktualisieren',
      refreshLead: 'Athan öffnen',
      refreshTail: 'zum Aktualisieren',
      catchBody: 'App öffnen zum Aktualisieren',
    },
    sq: {
      subtitle: 'Kohët e namazit për Londrën',
      inline: 'Athan — kohët e namazit',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Hap për të ngarkuar kohët',
      staleTitle: 'Jo e përditësuar',
      staleBody: 'Hap aplikacionin për të rifreskuar',
      staleInline: 'Athan — hap për të rifreskuar kohët',
      refreshLine: 'Hap Athan për të rifreskuar',
      refreshLead: 'Hap Athan',
      refreshTail: 'për të rifreskuar',
      catchBody: 'Hap aplikacionin për të rifreskuar',
    },
    bs: {
      subtitle: 'Vremena namaza za London',
      inline: 'Athan — vremena namaza',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Otvorite za učitavanje vremena',
      staleTitle: 'Zastarjelo',
      staleBody: 'Otvorite aplikaciju za osvježavanje',
      staleInline: 'Athan — otvorite za osvježavanje',
      refreshLine: 'Otvorite Athan za osvježavanje',
      refreshLead: 'Otvorite Athan',
      refreshTail: 'za osvježavanje',
      catchBody: 'Otvorite aplikaciju za osvježavanje',
    },
    ps: {
      subtitle: 'د لندن لپاره د لمانځه وختونه',
      inline: 'Athan — د لمانځه وختونه',
      rectTitle: 'ATHAN',
      rectSubtitle: 'د وختونو د لوډ لپاره پرانیزئ',
      staleTitle: 'تازه نه دی',
      staleBody: 'تازه کولو لپاره ایپ پرانیزئ',
      staleInline: 'Athan — د تازه کولو لپاره پرانیزئ',
      refreshLine: 'تازه کولو لپاره Athan پرانیزئ',
      refreshLead: 'Athan پرانیزئ',
      refreshTail: 'تازه کولو لپاره',
      catchBody: 'تازه کولو لپاره ایپ پرانیزئ',
    },
    ta: {
      subtitle: 'லண்டனுக்கான தொழுகை நேரங்கள்',
      inline: 'Athan — தொழுகை நேரங்கள்',
      rectTitle: 'ATHAN',
      rectSubtitle: 'நேரங்களை ஏற்ற திறக்கவும்',
      staleTitle: 'பழையது',
      staleBody: 'புதுப்பிக்க செயலியைத் திறக்கவும்',
      staleInline: 'Athan — புதுப்பிக்க திறக்கவும்',
      refreshLine: 'புதுப்பிக்க Athan திறக்கவும்',
      refreshLead: 'Athan திறக்கவும்',
      refreshTail: 'புதுப்பிக்க',
      catchBody: 'புதுப்பிக்க செயலியைத் திறக்கவும்',
    },
    ml: {
      subtitle: 'ലണ്ടനിലെ നമസ്കാര സമയങ്ങൾ',
      inline: 'Athan — നമസ്കാര സമയങ്ങൾ',
      rectTitle: 'ATHAN',
      rectSubtitle: 'സമയങ്ങൾ ലോഡ് ചെയ്യാൻ തുറക്കുക',
      staleTitle: 'കാലഹരണപ്പെട്ടു',
      staleBody: 'റിഫ്രഷ് ചെയ്യാൻ ആപ്പ് തുറക്കുക',
      staleInline: 'Athan — റിഫ്രഷ് ചെയ്യാൻ തുറക്കുക',
      refreshLine: 'റിഫ്രഷ് ചെയ്യാൻ Athan തുറക്കുക',
      refreshLead: 'Athan തുറക്കുക',
      refreshTail: 'റിഫ്രഷ് ചെയ്യാൻ',
      catchBody: 'റിഫ്രഷ് ചെയ്യാൻ ആപ്പ് തുറക്കുക',
    },
    'zh-Hans': {
      subtitle: '伦敦礼拜时间',
      inline: 'Athan — 礼拜时间',
      rectTitle: 'ATHAN',
      rectSubtitle: '打开以载入时间',
      staleTitle: '已过期',
      staleBody: '打开应用刷新',
      staleInline: 'Athan — 打开刷新时间',
      refreshLine: '打开 Athan 刷新',
      refreshLead: '打开 Athan',
      refreshTail: '刷新',
      catchBody: '打开应用刷新',
    },
    'zh-Hant': {
      subtitle: '倫敦禮拜時間',
      inline: 'Athan — 禮拜時間',
      rectTitle: 'ATHAN',
      rectSubtitle: '開啟以載入時間',
      staleTitle: '已過期',
      staleBody: '開啟應用程式重新整理',
      staleInline: 'Athan — 開啟重新整理時間',
      refreshLine: '開啟 Athan 重新整理',
      refreshLead: '開啟 Athan',
      refreshTail: '重新整理',
      catchBody: '開啟應用程式重新整理',
    },
    es: {
      subtitle: 'Horas de oración en Londres',
      inline: 'Athan — horas de oración',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Abre para cargar las horas',
      staleTitle: 'Desactualizado',
      staleBody: 'Abre la app para actualizar',
      staleInline: 'Athan — abre para actualizar',
      refreshLine: 'Abre Athan para actualizar',
      refreshLead: 'Abre Athan',
      refreshTail: 'para actualizar',
      catchBody: 'Abre la app para actualizar',
    },
    nl: {
      subtitle: 'Gebedstijden voor Londen',
      inline: 'Athan — gebedstijden',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Open om tijden te laden',
      staleTitle: 'Verouderd',
      staleBody: 'Open de app om te vernieuwen',
      staleInline: 'Athan — open om te vernieuwen',
      refreshLine: 'Athan openen om te vernieuwen',
      refreshLead: 'Athan openen',
      refreshTail: 'om te vernieuwen',
      catchBody: 'Open de app om te vernieuwen',
    },
  } as const;
  const deviceLocale = (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale ?? '';
  // Decision 9's zh mapping, the resolver's own rule: a zh tag with no script
  // subtag resolves by region, TW, HK and MO reading Traditional (CLDR's
  // likely-subtags answer) and every other zh tag Simplified. Script-tagged
  // locales already matched the list above, and yue is its own language code
  // and never matches zh
  const zhKeyFor = (tag: string): 'zh-Hans' | 'zh-Hant' | undefined =>
    tag === 'zh' || tag.startsWith('zh-')
      ? ['TW', 'HK', 'MO'].includes(tag.split('-')[1] ?? '')
        ? 'zh-Hant'
        : 'zh-Hans'
      : undefined;
  const localeKey =
    (
      [
        'en',
        'ar',
        'ms',
        'so',
        'hi',
        'th',
        'id',
        'tr',
        'fr',
        'uz',
        'sw',
        'ha',
        'pt',
        'ur',
        'fa',
        'bn',
        'ru',
        'az',
        'de',
        'sq',
        'bs',
        'ps',
        'ta',
        'ml',
        'zh-Hans',
        'zh-Hant',
        'es',
        'nl',
      ] as const
    ).find((code) => deviceLocale === code || deviceLocale.startsWith(`${code}-`)) ?? zhKeyFor(deviceLocale);
  const staticRow = STATIC[localeKey ?? 'en'];

  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {staticRow.inline}
        </Text>
      );
    }

    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {staticRow.rectTitle}
        </Text>
        <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {staticRow.rectSubtitle}
        </Text>
      </VStack>
    );
  };

  if (props == null) {
    return neutralForFamily();
  }

  try {
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      if (environment.widgetFamily === 'accessoryInline') {
        return (
          <Text
            modifiers={[
              font({ size: 14, weight: 'medium' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              containerBackground('rgba(0, 0, 0, 0)', 'widget'),
            ]}>
            {staticRow.staleInline}
          </Text>
        );
      }

      return (
        <VStack
          spacing={1}
          modifiers={[
            containerRelativeFrame({ axes: 'horizontal' }),
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          <Image systemName='moon.stars.fill' size={18} color={WHITE} />
          <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
            {staticRow.staleTitle}
          </Text>
          <Text modifiers={[font({ size: 15, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
            {staticRow.staleBody}
          </Text>
        </VStack>
      );
    }

    const TickingTextEl = Text as unknown as (elementProps: {
      timerInterval?: { lower: Date; upper: Date };
      countsDown?: boolean;
      modifiers?: unknown[];
    }) => ReactNode;

    const segment = { lower: new Date(props.prevEpochMs), upper: new Date(props.nextEpochMs) };

    // Inline concatenates its content, which stops a timer Text ticking, so
    // this face falls back to the absolute time.
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {props.nextName} {props.nextTime}
        </Text>
      );
    }

    return (
      <VStack
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        {/* Two equal halves meeting at the slot's midline, because a timer Text
            reserves a worst-case width: a shrink-wrapped row measures that
            reservation rather than the glyphs, so centring the row leaves the
            name against the slot's edge. Anchoring each half to the midline
            instead makes the name's last letter and the countdown's first digit
            land in the same place whatever their lengths, which no centred row
            can do while one child misreports its width. */}
        <HStack spacing={0}>
          <Text
            modifiers={[
              font({ size: 17, weight: 'bold' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              minimumScaleFactor(0.83),
              frame({ maxWidth: Infinity, alignment: 'trailing' }),
              padding({ trailing: 3 }),
            ]}>
            {props.nextName}
          </Text>
          <TickingTextEl
            timerInterval={segment}
            countsDown
            modifiers={[
              font({ size: 17, weight: 'medium' }),
              monospacedDigit(),
              foregroundStyle(WHITE_MUTED),
              lineLimit(1),
              minimumScaleFactor(0.83),
              frame({ maxWidth: Infinity, alignment: 'leading' }),
              padding({ leading: 3 }),
            ]}
          />
        </HStack>
      </VStack>
    );
  } catch {
    return neutralForFamily();
  }
};

export const PrayerLockWidget = createWidget('PrayerLockWidget', AthanLockWidgetCountdownPair);
export const ExtrasLockWidget = createWidget('ExtrasLockWidget', AthanLockWidgetCountdownPair);

// A separate self-contained function: the 'widget' directive serializes
// each body alone, so nothing can be shared across the layouts.
const AthanLockWidgetCentred = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';

  // The neutral, stale and catch cards follow the device locale the widget
  // process itself reads (D44): absent props carry no app language. The
  // prefix match accepts region tags; anything unknown renders the en row.
  const STATIC = {
    en: {
      subtitle: 'Prayer times for London',
      inline: 'Athan — prayer times',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Open to load times',
      staleTitle: 'Out of date',
      staleBody: 'Open app to refresh',
      staleInline: 'Athan — open to refresh times',
      refreshLine: 'Open Athan to refresh',
      refreshLead: 'Open Athan',
      refreshTail: 'to refresh',
      catchBody: 'Open the app to refresh',
    },
    ar: {
      subtitle: 'أوقات الصلاة في لندن',
      inline: 'Athan - أوقات الصلاة',
      rectTitle: 'ATHAN',
      rectSubtitle: 'افتح لتحميل الأوقات',
      staleTitle: 'غير محدّث',
      staleBody: 'افتح التطبيق للتحديث',
      staleInline: 'Athan - افتح لتحديث الأوقات',
      refreshLine: 'افتح Athan للتحديث',
      refreshLead: 'افتح Athan',
      refreshTail: 'للتحديث',
      catchBody: 'افتح التطبيق للتحديث',
    },
    ms: {
      subtitle: 'Waktu solat untuk London',
      inline: 'Athan - waktu solat',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buka untuk muat waktu',
      staleTitle: 'Tidak dikemas kini',
      staleBody: 'Buka apl untuk muat semula',
      staleInline: 'Athan - buka untuk muat semula waktu',
      refreshLine: 'Buka Athan untuk muat semula',
      refreshLead: 'Buka Athan',
      refreshTail: 'untuk muat semula',
      catchBody: 'Buka aplikasi untuk muat semula',
    },
    so: {
      subtitle: 'Waqtiyada salaadda London',
      inline: 'Athan - waqtiyada salaadda',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Fur si aad u soo dejinto waqtiyada',
      staleTitle: "Cusboonaysi la'aan",
      staleBody: 'Fur aplka si aad u cusboonaysiiso',
      staleInline: 'Athan - fur si aad u cusboonaysiiso waqtiyada',
      refreshLine: 'Fur Athan si aad u cusboonaysiiso',
      refreshLead: 'Fur Athan',
      refreshTail: 'si aad u cusboonaysiiso',
      catchBody: 'Fur app-ka si aad u cusboonaysiiso',
    },
    hi: {
      subtitle: 'लंदन के नमाज़ के समय',
      inline: 'Athan - नमाज़ के समय',
      rectTitle: 'ATHAN',
      rectSubtitle: 'समय लोड करने के लिए खोलें',
      staleTitle: 'पुराना',
      staleBody: 'रिफ्रेश के लिए ऐप खोलें',
      staleInline: 'Athan - समय रिफ्रेश करने के लिए खोलें',
      refreshLine: 'रिफ्रेश के लिए Athan खोलें',
      refreshLead: 'Athan खोलें',
      refreshTail: 'रिफ्रेश के लिए',
      catchBody: 'रिफ्रेश के लिए ऐप खोलें',
    },
    th: {
      subtitle: 'เวลาละหมาดสำหรับลอนดอน',
      inline: 'Athan - เวลาละหมาด',
      rectTitle: 'ATHAN',
      rectSubtitle: 'เปิดเพื่อโหลดเวลา',
      staleTitle: 'ข้อมูลเก่า',
      staleBody: 'เปิดแอปเพื่อรีเฟรช',
      staleInline: 'Athan - เปิดเพื่อรีเฟรชเวลา',
      refreshLine: 'เปิด Athan เพื่อรีเฟรช',
      refreshLead: 'เปิด Athan',
      refreshTail: 'เพื่อรีเฟรช',
      catchBody: 'เปิดแอปเพื่อรีเฟรช',
    },
    id: {
      subtitle: 'Waktu salat untuk London',
      inline: 'Athan — waktu salat',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buka untuk memuat waktu',
      staleTitle: 'Kedaluwarsa',
      staleBody: 'Buka aplikasi untuk menyegarkan',
      staleInline: 'Athan — buka untuk menyegarkan waktu',
      refreshLine: 'Buka Athan untuk menyegarkan',
      refreshLead: 'Buka Athan',
      refreshTail: 'untuk menyegarkan',
      catchBody: 'Buka aplikasi untuk menyegarkan',
    },
    tr: {
      subtitle: 'Londra için namaz vakitleri',
      inline: 'Athan — namaz vakitleri',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vakitleri yüklemek için açın',
      staleTitle: 'Güncel değil',
      staleBody: 'Yenilemek için uygulamayı açın',
      staleInline: 'Athan — vakitleri yenilemek için açın',
      refreshLine: 'Yenilemek için Athan uygulamasını açın',
      refreshLead: 'Athan uygulamasını açın',
      refreshTail: 'yenilemek için',
      catchBody: 'Yenilemek için uygulamayı açın',
    },
    fr: {
      subtitle: 'Horaires de prière pour Londres',
      inline: 'Athan — horaires de prière',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Ouvrir pour charger les heures',
      staleTitle: 'Périmé',
      staleBody: "Ouvrir l'app pour actualiser",
      staleInline: 'Athan — ouvrir pour actualiser les heures',
      refreshLine: 'Ouvrir Athan pour actualiser',
      refreshLead: 'Ouvrir Athan',
      refreshTail: 'pour actualiser',
      catchBody: "Ouvrir l'application pour actualiser",
    },
    uz: {
      subtitle: 'London uchun namoz vaqtlari',
      inline: 'Athan — namoz vaqtlari',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vaqtlarni yuklash uchun oching',
      staleTitle: 'Eskirgan',
      staleBody: 'Yangilash uchun ilovani oching',
      staleInline: 'Athan — vaqtlarni yangilash uchun oching',
      refreshLine: 'Yangilash uchun Athan ilovasini oching',
      refreshLead: 'Athan ilovasini oching',
      refreshTail: 'yangilash uchun',
      catchBody: 'Yangilash uchun ilovani oching',
    },
    sw: {
      subtitle: 'Nyakati za swala London',
      inline: 'Athan — nyakati za swala',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Fungua kupakia nyakati',
      staleTitle: 'Haijasasishwa',
      staleBody: 'Fungua programu kusasisha',
      staleInline: 'Athan — fungua kusasisha nyakati',
      refreshLine: 'Fungua Athan kusasisha',
      refreshLead: 'Fungua Athan',
      refreshTail: 'kusasisha',
      catchBody: 'Fungua programu kusasisha',
    },
    ha: {
      subtitle: 'Lokutan salla London',
      inline: 'Athan — lokutan salla',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buɗe don ɗora lokuta',
      staleTitle: 'Ba a sabunta ba',
      staleBody: 'Buɗe app ɗin don sabuntawa',
      staleInline: 'Athan — buɗe don sabunta lokuta',
      refreshLine: 'Buɗe Athan don sabuntawa',
      refreshLead: 'Buɗe Athan',
      refreshTail: 'don sabuntawa',
      catchBody: 'Buɗe app ɗin don sabuntawa',
    },
    pt: {
      subtitle: 'Horários de oração para Londres',
      inline: 'Athan — horários de oração',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Abrir para carregar horários',
      staleTitle: 'Desatualizado',
      staleBody: 'Abrir o app para atualizar',
      staleInline: 'Athan — abrir para atualizar horários',
      refreshLine: 'Abrir Athan para atualizar',
      refreshLead: 'Abrir Athan',
      refreshTail: 'para atualizar',
      catchBody: 'Abrir o aplicativo para atualizar',
    },
    ur: {
      subtitle: 'لندن کے نماز کے اوقات',
      inline: 'Athan — اوقاتِ نماز',
      rectTitle: 'ATHAN',
      rectSubtitle: 'اوقات لوڈ کرنے کے لیے کھولیں',
      staleTitle: 'تازہ نہیں',
      staleBody: 'تازہ کاری کے لیے ایپ کھولیں',
      staleInline: 'Athan — اوقات تازہ کرنے کے لیے کھولیں',
      refreshLine: 'تازہ کاری کے لیے Athan کھولیں',
      refreshLead: 'Athan کھولیں',
      refreshTail: 'تازہ کاری کے لیے',
      catchBody: 'تازہ کاری کے لیے ایپ کھولیں',
    },
    fa: {
      subtitle: 'اوقات نماز لندن',
      inline: 'Athan — اوقات نماز',
      rectTitle: 'ATHAN',
      rectSubtitle: 'برای بارگیری اوقات باز کنید',
      staleTitle: 'به‌روز نیست',
      staleBody: 'برای به‌روزرسانی برنامه را باز کنید',
      staleInline: 'Athan — برای به‌روزرسانی اوقات باز کنید',
      refreshLine: 'برای به‌روزرسانی Athan را باز کنید',
      refreshLead: 'Athan را باز کنید',
      refreshTail: 'برای به‌روزرسانی',
      catchBody: 'برای به‌روزرسانی برنامه را باز کنید',
    },
    bn: {
      subtitle: 'লন্ডনের নামাজের সময়',
      inline: 'Athan — নামাজের সময়',
      rectTitle: 'ATHAN',
      rectSubtitle: 'সময় লোড করতে খুলুন',
      staleTitle: 'পুরোনো',
      staleBody: 'রিফ্রেশ করতে অ্যাপ খুলুন',
      staleInline: 'Athan — সময় রিফ্রেশ করতে খুলুন',
      refreshLine: 'রিফ্রেশ করতে Athan খুলুন',
      refreshLead: 'Athan খুলুন',
      refreshTail: 'রিফ্রেশ করতে',
      catchBody: 'রিফ্রেশ করতে অ্যাপটি খুলুন',
    },
    ru: {
      subtitle: 'Времена намаза для Лондона',
      inline: 'Athan — времена намаза',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Откройте, чтобы загрузить времена',
      staleTitle: 'Устарело',
      staleBody: 'Откройте приложение, чтобы обновить',
      staleInline: 'Athan — откройте, чтобы обновить времена',
      refreshLine: 'Откройте Athan, чтобы обновить',
      refreshLead: 'Откройте Athan',
      refreshTail: 'чтобы обновить',
      catchBody: 'Откройте приложение, чтобы обновить',
    },
    az: {
      subtitle: 'London üçün namaz vaxtları',
      inline: 'Athan — namaz vaxtları',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vaxtları yükləmək üçün açın',
      staleTitle: 'Güncəl deyil',
      staleBody: 'Yeniləmək üçün tətbiqi açın',
      staleInline: 'Athan — vaxtları yeniləmək üçün açın',
      refreshLine: 'Yeniləmək üçün Athan tətbiqini açın',
      refreshLead: 'Athan tətbiqini açın',
      refreshTail: 'yeniləmək üçün',
      catchBody: 'Yeniləmək üçün tətbiqi açın',
    },
    de: {
      subtitle: 'Gebetszeiten für London',
      inline: 'Athan — Gebetszeiten',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Zum Laden der Zeiten öffnen',
      staleTitle: 'Nicht aktuell',
      staleBody: 'App öffnen zum Aktualisieren',
      staleInline: 'Athan — öffnen zum Aktualisieren',
      refreshLine: 'Athan öffnen zum Aktualisieren',
      refreshLead: 'Athan öffnen',
      refreshTail: 'zum Aktualisieren',
      catchBody: 'App öffnen zum Aktualisieren',
    },
    sq: {
      subtitle: 'Kohët e namazit për Londrën',
      inline: 'Athan — kohët e namazit',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Hap për të ngarkuar kohët',
      staleTitle: 'Jo e përditësuar',
      staleBody: 'Hap aplikacionin për të rifreskuar',
      staleInline: 'Athan — hap për të rifreskuar kohët',
      refreshLine: 'Hap Athan për të rifreskuar',
      refreshLead: 'Hap Athan',
      refreshTail: 'për të rifreskuar',
      catchBody: 'Hap aplikacionin për të rifreskuar',
    },
    bs: {
      subtitle: 'Vremena namaza za London',
      inline: 'Athan — vremena namaza',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Otvorite za učitavanje vremena',
      staleTitle: 'Zastarjelo',
      staleBody: 'Otvorite aplikaciju za osvježavanje',
      staleInline: 'Athan — otvorite za osvježavanje',
      refreshLine: 'Otvorite Athan za osvježavanje',
      refreshLead: 'Otvorite Athan',
      refreshTail: 'za osvježavanje',
      catchBody: 'Otvorite aplikaciju za osvježavanje',
    },
    ps: {
      subtitle: 'د لندن لپاره د لمانځه وختونه',
      inline: 'Athan — د لمانځه وختونه',
      rectTitle: 'ATHAN',
      rectSubtitle: 'د وختونو د لوډ لپاره پرانیزئ',
      staleTitle: 'تازه نه دی',
      staleBody: 'تازه کولو لپاره ایپ پرانیزئ',
      staleInline: 'Athan — د تازه کولو لپاره پرانیزئ',
      refreshLine: 'تازه کولو لپاره Athan پرانیزئ',
      refreshLead: 'Athan پرانیزئ',
      refreshTail: 'تازه کولو لپاره',
      catchBody: 'تازه کولو لپاره ایپ پرانیزئ',
    },
    ta: {
      subtitle: 'லண்டனுக்கான தொழுகை நேரங்கள்',
      inline: 'Athan — தொழுகை நேரங்கள்',
      rectTitle: 'ATHAN',
      rectSubtitle: 'நேரங்களை ஏற்ற திறக்கவும்',
      staleTitle: 'பழையது',
      staleBody: 'புதுப்பிக்க செயலியைத் திறக்கவும்',
      staleInline: 'Athan — புதுப்பிக்க திறக்கவும்',
      refreshLine: 'புதுப்பிக்க Athan திறக்கவும்',
      refreshLead: 'Athan திறக்கவும்',
      refreshTail: 'புதுப்பிக்க',
      catchBody: 'புதுப்பிக்க செயலியைத் திறக்கவும்',
    },
    ml: {
      subtitle: 'ലണ്ടനിലെ നമസ്കാര സമയങ്ങൾ',
      inline: 'Athan — നമസ്കാര സമയങ്ങൾ',
      rectTitle: 'ATHAN',
      rectSubtitle: 'സമയങ്ങൾ ലോഡ് ചെയ്യാൻ തുറക്കുക',
      staleTitle: 'കാലഹരണപ്പെട്ടു',
      staleBody: 'റിഫ്രഷ് ചെയ്യാൻ ആപ്പ് തുറക്കുക',
      staleInline: 'Athan — റിഫ്രഷ് ചെയ്യാൻ തുറക്കുക',
      refreshLine: 'റിഫ്രഷ് ചെയ്യാൻ Athan തുറക്കുക',
      refreshLead: 'Athan തുറക്കുക',
      refreshTail: 'റിഫ്രഷ് ചെയ്യാൻ',
      catchBody: 'റിഫ്രഷ് ചെയ്യാൻ ആപ്പ് തുറക്കുക',
    },
    'zh-Hans': {
      subtitle: '伦敦礼拜时间',
      inline: 'Athan — 礼拜时间',
      rectTitle: 'ATHAN',
      rectSubtitle: '打开以载入时间',
      staleTitle: '已过期',
      staleBody: '打开应用刷新',
      staleInline: 'Athan — 打开刷新时间',
      refreshLine: '打开 Athan 刷新',
      refreshLead: '打开 Athan',
      refreshTail: '刷新',
      catchBody: '打开应用刷新',
    },
    'zh-Hant': {
      subtitle: '倫敦禮拜時間',
      inline: 'Athan — 禮拜時間',
      rectTitle: 'ATHAN',
      rectSubtitle: '開啟以載入時間',
      staleTitle: '已過期',
      staleBody: '開啟應用程式重新整理',
      staleInline: 'Athan — 開啟重新整理時間',
      refreshLine: '開啟 Athan 重新整理',
      refreshLead: '開啟 Athan',
      refreshTail: '重新整理',
      catchBody: '開啟應用程式重新整理',
    },
    es: {
      subtitle: 'Horas de oración en Londres',
      inline: 'Athan — horas de oración',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Abre para cargar las horas',
      staleTitle: 'Desactualizado',
      staleBody: 'Abre la app para actualizar',
      staleInline: 'Athan — abre para actualizar',
      refreshLine: 'Abre Athan para actualizar',
      refreshLead: 'Abre Athan',
      refreshTail: 'para actualizar',
      catchBody: 'Abre la app para actualizar',
    },
    nl: {
      subtitle: 'Gebedstijden voor Londen',
      inline: 'Athan — gebedstijden',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Open om tijden te laden',
      staleTitle: 'Verouderd',
      staleBody: 'Open de app om te vernieuwen',
      staleInline: 'Athan — open om te vernieuwen',
      refreshLine: 'Athan openen om te vernieuwen',
      refreshLead: 'Athan openen',
      refreshTail: 'om te vernieuwen',
      catchBody: 'Open de app om te vernieuwen',
    },
  } as const;
  const deviceLocale = (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale ?? '';
  // Decision 9's zh mapping, the resolver's own rule: a zh tag with no script
  // subtag resolves by region, TW, HK and MO reading Traditional (CLDR's
  // likely-subtags answer) and every other zh tag Simplified. Script-tagged
  // locales already matched the list above, and yue is its own language code
  // and never matches zh
  const zhKeyFor = (tag: string): 'zh-Hans' | 'zh-Hant' | undefined =>
    tag === 'zh' || tag.startsWith('zh-')
      ? ['TW', 'HK', 'MO'].includes(tag.split('-')[1] ?? '')
        ? 'zh-Hant'
        : 'zh-Hans'
      : undefined;
  const localeKey =
    (
      [
        'en',
        'ar',
        'ms',
        'so',
        'hi',
        'th',
        'id',
        'tr',
        'fr',
        'uz',
        'sw',
        'ha',
        'pt',
        'ur',
        'fa',
        'bn',
        'ru',
        'az',
        'de',
        'sq',
        'bs',
        'ps',
        'ta',
        'ml',
        'zh-Hans',
        'zh-Hant',
        'es',
        'nl',
      ] as const
    ).find((code) => deviceLocale === code || deviceLocale.startsWith(`${code}-`)) ?? zhKeyFor(deviceLocale);
  const staticRow = STATIC[localeKey ?? 'en'];

  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {staticRow.inline}
        </Text>
      );
    }

    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {staticRow.rectTitle}
        </Text>
        <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {staticRow.rectSubtitle}
        </Text>
      </VStack>
    );
  };

  if (props == null) {
    return neutralForFamily();
  }

  try {
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      if (environment.widgetFamily === 'accessoryInline') {
        return (
          <Text
            modifiers={[
              font({ size: 14, weight: 'medium' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              containerBackground('rgba(0, 0, 0, 0)', 'widget'),
            ]}>
            {staticRow.staleInline}
          </Text>
        );
      }

      return (
        <VStack
          spacing={1}
          modifiers={[
            containerRelativeFrame({ axes: 'horizontal' }),
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          <Image systemName='moon.stars.fill' size={18} color={WHITE} />
          <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
            {staticRow.staleTitle}
          </Text>
          <Text modifiers={[font({ size: 15, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
            {staticRow.staleBody}
          </Text>
        </VStack>
      );
    }

    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {props.nextName} {props.nextTime}
        </Text>
      );
    }

    // Centred because the rectangular face can span half the lock screen —
    // a left-anchored line would float off-balance in the wide slot. Just
    // the name and the absolute time: the dot and
    // the countdown are gone from this layout.
    return (
      <VStack
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        {/* Halves anchored at the midline, as Layout 1 does: prayer names differ
            in length, so a shrink-wrapped row moves the whole pair with every
            name, while a fixed seam keeps the last letter and the first digit
            where they were. */}
        <HStack spacing={0}>
          <Text
            modifiers={[
              font({ size: 17, weight: 'bold' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              minimumScaleFactor(0.83),
              frame({ maxWidth: Infinity, alignment: 'trailing' }),
              padding({ trailing: 3 }),
            ]}>
            {props.nextName}
          </Text>
          <Text
            modifiers={[
              font({ size: 17, weight: 'medium' }),
              monospacedDigit(),
              foregroundStyle(WHITE_MUTED),
              lineLimit(1),
              minimumScaleFactor(0.83),
              frame({ maxWidth: Infinity, alignment: 'leading' }),
              padding({ leading: 3 }),
            ]}>
            {props.nextTime}
          </Text>
        </HStack>
      </VStack>
    );
  } catch {
    return neutralForFamily();
  }
};

export const PrayerLockWidget2 = createWidget('PrayerLockWidget2', AthanLockWidgetCentred);
export const ExtrasLockWidget2 = createWidget('ExtrasLockWidget2', AthanLockWidgetCentred);

const AthanLockWidgetStacked = (props: PrayerWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  // Only the absolute time recedes; the system tints both in vibrant mode.
  const WHITE = '#ffffff';
  const WHITE_MUTED = 'rgba(255, 255, 255, 0.6)';

  // The neutral, stale and catch cards follow the device locale the widget
  // process itself reads (D44): absent props carry no app language. The
  // prefix match accepts region tags; anything unknown renders the en row.
  const STATIC = {
    en: {
      subtitle: 'Prayer times for London',
      inline: 'Athan — prayer times',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Open to load times',
      staleTitle: 'Out of date',
      staleBody: 'Open app to refresh',
      staleInline: 'Athan — open to refresh times',
      refreshLine: 'Open Athan to refresh',
      refreshLead: 'Open Athan',
      refreshTail: 'to refresh',
      catchBody: 'Open the app to refresh',
    },
    ar: {
      subtitle: 'أوقات الصلاة في لندن',
      inline: 'Athan - أوقات الصلاة',
      rectTitle: 'ATHAN',
      rectSubtitle: 'افتح لتحميل الأوقات',
      staleTitle: 'غير محدّث',
      staleBody: 'افتح التطبيق للتحديث',
      staleInline: 'Athan - افتح لتحديث الأوقات',
      refreshLine: 'افتح Athan للتحديث',
      refreshLead: 'افتح Athan',
      refreshTail: 'للتحديث',
      catchBody: 'افتح التطبيق للتحديث',
    },
    ms: {
      subtitle: 'Waktu solat untuk London',
      inline: 'Athan - waktu solat',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buka untuk muat waktu',
      staleTitle: 'Tidak dikemas kini',
      staleBody: 'Buka apl untuk muat semula',
      staleInline: 'Athan - buka untuk muat semula waktu',
      refreshLine: 'Buka Athan untuk muat semula',
      refreshLead: 'Buka Athan',
      refreshTail: 'untuk muat semula',
      catchBody: 'Buka aplikasi untuk muat semula',
    },
    so: {
      subtitle: 'Waqtiyada salaadda London',
      inline: 'Athan - waqtiyada salaadda',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Fur si aad u soo dejinto waqtiyada',
      staleTitle: "Cusboonaysi la'aan",
      staleBody: 'Fur aplka si aad u cusboonaysiiso',
      staleInline: 'Athan - fur si aad u cusboonaysiiso waqtiyada',
      refreshLine: 'Fur Athan si aad u cusboonaysiiso',
      refreshLead: 'Fur Athan',
      refreshTail: 'si aad u cusboonaysiiso',
      catchBody: 'Fur app-ka si aad u cusboonaysiiso',
    },
    hi: {
      subtitle: 'लंदन के नमाज़ के समय',
      inline: 'Athan - नमाज़ के समय',
      rectTitle: 'ATHAN',
      rectSubtitle: 'समय लोड करने के लिए खोलें',
      staleTitle: 'पुराना',
      staleBody: 'रिफ्रेश के लिए ऐप खोलें',
      staleInline: 'Athan - समय रिफ्रेश करने के लिए खोलें',
      refreshLine: 'रिफ्रेश के लिए Athan खोलें',
      refreshLead: 'Athan खोलें',
      refreshTail: 'रिफ्रेश के लिए',
      catchBody: 'रिफ्रेश के लिए ऐप खोलें',
    },
    th: {
      subtitle: 'เวลาละหมาดสำหรับลอนดอน',
      inline: 'Athan - เวลาละหมาด',
      rectTitle: 'ATHAN',
      rectSubtitle: 'เปิดเพื่อโหลดเวลา',
      staleTitle: 'ข้อมูลเก่า',
      staleBody: 'เปิดแอปเพื่อรีเฟรช',
      staleInline: 'Athan - เปิดเพื่อรีเฟรชเวลา',
      refreshLine: 'เปิด Athan เพื่อรีเฟรช',
      refreshLead: 'เปิด Athan',
      refreshTail: 'เพื่อรีเฟรช',
      catchBody: 'เปิดแอปเพื่อรีเฟรช',
    },
    id: {
      subtitle: 'Waktu salat untuk London',
      inline: 'Athan — waktu salat',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buka untuk memuat waktu',
      staleTitle: 'Kedaluwarsa',
      staleBody: 'Buka aplikasi untuk menyegarkan',
      staleInline: 'Athan — buka untuk menyegarkan waktu',
      refreshLine: 'Buka Athan untuk menyegarkan',
      refreshLead: 'Buka Athan',
      refreshTail: 'untuk menyegarkan',
      catchBody: 'Buka aplikasi untuk menyegarkan',
    },
    tr: {
      subtitle: 'Londra için namaz vakitleri',
      inline: 'Athan — namaz vakitleri',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vakitleri yüklemek için açın',
      staleTitle: 'Güncel değil',
      staleBody: 'Yenilemek için uygulamayı açın',
      staleInline: 'Athan — vakitleri yenilemek için açın',
      refreshLine: 'Yenilemek için Athan uygulamasını açın',
      refreshLead: 'Athan uygulamasını açın',
      refreshTail: 'yenilemek için',
      catchBody: 'Yenilemek için uygulamayı açın',
    },
    fr: {
      subtitle: 'Horaires de prière pour Londres',
      inline: 'Athan — horaires de prière',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Ouvrir pour charger les heures',
      staleTitle: 'Périmé',
      staleBody: "Ouvrir l'app pour actualiser",
      staleInline: 'Athan — ouvrir pour actualiser les heures',
      refreshLine: 'Ouvrir Athan pour actualiser',
      refreshLead: 'Ouvrir Athan',
      refreshTail: 'pour actualiser',
      catchBody: "Ouvrir l'application pour actualiser",
    },
    uz: {
      subtitle: 'London uchun namoz vaqtlari',
      inline: 'Athan — namoz vaqtlari',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vaqtlarni yuklash uchun oching',
      staleTitle: 'Eskirgan',
      staleBody: 'Yangilash uchun ilovani oching',
      staleInline: 'Athan — vaqtlarni yangilash uchun oching',
      refreshLine: 'Yangilash uchun Athan ilovasini oching',
      refreshLead: 'Athan ilovasini oching',
      refreshTail: 'yangilash uchun',
      catchBody: 'Yangilash uchun ilovani oching',
    },
    sw: {
      subtitle: 'Nyakati za swala London',
      inline: 'Athan — nyakati za swala',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Fungua kupakia nyakati',
      staleTitle: 'Haijasasishwa',
      staleBody: 'Fungua programu kusasisha',
      staleInline: 'Athan — fungua kusasisha nyakati',
      refreshLine: 'Fungua Athan kusasisha',
      refreshLead: 'Fungua Athan',
      refreshTail: 'kusasisha',
      catchBody: 'Fungua programu kusasisha',
    },
    ha: {
      subtitle: 'Lokutan salla London',
      inline: 'Athan — lokutan salla',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Buɗe don ɗora lokuta',
      staleTitle: 'Ba a sabunta ba',
      staleBody: 'Buɗe app ɗin don sabuntawa',
      staleInline: 'Athan — buɗe don sabunta lokuta',
      refreshLine: 'Buɗe Athan don sabuntawa',
      refreshLead: 'Buɗe Athan',
      refreshTail: 'don sabuntawa',
      catchBody: 'Buɗe app ɗin don sabuntawa',
    },
    pt: {
      subtitle: 'Horários de oração para Londres',
      inline: 'Athan — horários de oração',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Abrir para carregar horários',
      staleTitle: 'Desatualizado',
      staleBody: 'Abrir o app para atualizar',
      staleInline: 'Athan — abrir para atualizar horários',
      refreshLine: 'Abrir Athan para atualizar',
      refreshLead: 'Abrir Athan',
      refreshTail: 'para atualizar',
      catchBody: 'Abrir o aplicativo para atualizar',
    },
    ur: {
      subtitle: 'لندن کے نماز کے اوقات',
      inline: 'Athan — اوقاتِ نماز',
      rectTitle: 'ATHAN',
      rectSubtitle: 'اوقات لوڈ کرنے کے لیے کھولیں',
      staleTitle: 'تازہ نہیں',
      staleBody: 'تازہ کاری کے لیے ایپ کھولیں',
      staleInline: 'Athan — اوقات تازہ کرنے کے لیے کھولیں',
      refreshLine: 'تازہ کاری کے لیے Athan کھولیں',
      refreshLead: 'Athan کھولیں',
      refreshTail: 'تازہ کاری کے لیے',
      catchBody: 'تازہ کاری کے لیے ایپ کھولیں',
    },
    fa: {
      subtitle: 'اوقات نماز لندن',
      inline: 'Athan — اوقات نماز',
      rectTitle: 'ATHAN',
      rectSubtitle: 'برای بارگیری اوقات باز کنید',
      staleTitle: 'به‌روز نیست',
      staleBody: 'برای به‌روزرسانی برنامه را باز کنید',
      staleInline: 'Athan — برای به‌روزرسانی اوقات باز کنید',
      refreshLine: 'برای به‌روزرسانی Athan را باز کنید',
      refreshLead: 'Athan را باز کنید',
      refreshTail: 'برای به‌روزرسانی',
      catchBody: 'برای به‌روزرسانی برنامه را باز کنید',
    },
    bn: {
      subtitle: 'লন্ডনের নামাজের সময়',
      inline: 'Athan — নামাজের সময়',
      rectTitle: 'ATHAN',
      rectSubtitle: 'সময় লোড করতে খুলুন',
      staleTitle: 'পুরোনো',
      staleBody: 'রিফ্রেশ করতে অ্যাপ খুলুন',
      staleInline: 'Athan — সময় রিফ্রেশ করতে খুলুন',
      refreshLine: 'রিফ্রেশ করতে Athan খুলুন',
      refreshLead: 'Athan খুলুন',
      refreshTail: 'রিফ্রেশ করতে',
      catchBody: 'রিফ্রেশ করতে অ্যাপটি খুলুন',
    },
    ru: {
      subtitle: 'Времена намаза для Лондона',
      inline: 'Athan — времена намаза',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Откройте, чтобы загрузить времена',
      staleTitle: 'Устарело',
      staleBody: 'Откройте приложение, чтобы обновить',
      staleInline: 'Athan — откройте, чтобы обновить времена',
      refreshLine: 'Откройте Athan, чтобы обновить',
      refreshLead: 'Откройте Athan',
      refreshTail: 'чтобы обновить',
      catchBody: 'Откройте приложение, чтобы обновить',
    },
    az: {
      subtitle: 'London üçün namaz vaxtları',
      inline: 'Athan — namaz vaxtları',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Vaxtları yükləmək üçün açın',
      staleTitle: 'Güncəl deyil',
      staleBody: 'Yeniləmək üçün tətbiqi açın',
      staleInline: 'Athan — vaxtları yeniləmək üçün açın',
      refreshLine: 'Yeniləmək üçün Athan tətbiqini açın',
      refreshLead: 'Athan tətbiqini açın',
      refreshTail: 'yeniləmək üçün',
      catchBody: 'Yeniləmək üçün tətbiqi açın',
    },
    de: {
      subtitle: 'Gebetszeiten für London',
      inline: 'Athan — Gebetszeiten',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Zum Laden der Zeiten öffnen',
      staleTitle: 'Nicht aktuell',
      staleBody: 'App öffnen zum Aktualisieren',
      staleInline: 'Athan — öffnen zum Aktualisieren',
      refreshLine: 'Athan öffnen zum Aktualisieren',
      refreshLead: 'Athan öffnen',
      refreshTail: 'zum Aktualisieren',
      catchBody: 'App öffnen zum Aktualisieren',
    },
    sq: {
      subtitle: 'Kohët e namazit për Londrën',
      inline: 'Athan — kohët e namazit',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Hap për të ngarkuar kohët',
      staleTitle: 'Jo e përditësuar',
      staleBody: 'Hap aplikacionin për të rifreskuar',
      staleInline: 'Athan — hap për të rifreskuar kohët',
      refreshLine: 'Hap Athan për të rifreskuar',
      refreshLead: 'Hap Athan',
      refreshTail: 'për të rifreskuar',
      catchBody: 'Hap aplikacionin për të rifreskuar',
    },
    bs: {
      subtitle: 'Vremena namaza za London',
      inline: 'Athan — vremena namaza',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Otvorite za učitavanje vremena',
      staleTitle: 'Zastarjelo',
      staleBody: 'Otvorite aplikaciju za osvježavanje',
      staleInline: 'Athan — otvorite za osvježavanje',
      refreshLine: 'Otvorite Athan za osvježavanje',
      refreshLead: 'Otvorite Athan',
      refreshTail: 'za osvježavanje',
      catchBody: 'Otvorite aplikaciju za osvježavanje',
    },
    ps: {
      subtitle: 'د لندن لپاره د لمانځه وختونه',
      inline: 'Athan — د لمانځه وختونه',
      rectTitle: 'ATHAN',
      rectSubtitle: 'د وختونو د لوډ لپاره پرانیزئ',
      staleTitle: 'تازه نه دی',
      staleBody: 'تازه کولو لپاره ایپ پرانیزئ',
      staleInline: 'Athan — د تازه کولو لپاره پرانیزئ',
      refreshLine: 'تازه کولو لپاره Athan پرانیزئ',
      refreshLead: 'Athan پرانیزئ',
      refreshTail: 'تازه کولو لپاره',
      catchBody: 'تازه کولو لپاره ایپ پرانیزئ',
    },
    ta: {
      subtitle: 'லண்டனுக்கான தொழுகை நேரங்கள்',
      inline: 'Athan — தொழுகை நேரங்கள்',
      rectTitle: 'ATHAN',
      rectSubtitle: 'நேரங்களை ஏற்ற திறக்கவும்',
      staleTitle: 'பழையது',
      staleBody: 'புதுப்பிக்க செயலியைத் திறக்கவும்',
      staleInline: 'Athan — புதுப்பிக்க திறக்கவும்',
      refreshLine: 'புதுப்பிக்க Athan திறக்கவும்',
      refreshLead: 'Athan திறக்கவும்',
      refreshTail: 'புதுப்பிக்க',
      catchBody: 'புதுப்பிக்க செயலியைத் திறக்கவும்',
    },
    ml: {
      subtitle: 'ലണ്ടനിലെ നമസ്കാര സമയങ്ങൾ',
      inline: 'Athan — നമസ്കാര സമയങ്ങൾ',
      rectTitle: 'ATHAN',
      rectSubtitle: 'സമയങ്ങൾ ലോഡ് ചെയ്യാൻ തുറക്കുക',
      staleTitle: 'കാലഹരണപ്പെട്ടു',
      staleBody: 'റിഫ്രഷ് ചെയ്യാൻ ആപ്പ് തുറക്കുക',
      staleInline: 'Athan — റിഫ്രഷ് ചെയ്യാൻ തുറക്കുക',
      refreshLine: 'റിഫ്രഷ് ചെയ്യാൻ Athan തുറക്കുക',
      refreshLead: 'Athan തുറക്കുക',
      refreshTail: 'റിഫ്രഷ് ചെയ്യാൻ',
      catchBody: 'റിഫ്രഷ് ചെയ്യാൻ ആപ്പ് തുറക്കുക',
    },
    'zh-Hans': {
      subtitle: '伦敦礼拜时间',
      inline: 'Athan — 礼拜时间',
      rectTitle: 'ATHAN',
      rectSubtitle: '打开以载入时间',
      staleTitle: '已过期',
      staleBody: '打开应用刷新',
      staleInline: 'Athan — 打开刷新时间',
      refreshLine: '打开 Athan 刷新',
      refreshLead: '打开 Athan',
      refreshTail: '刷新',
      catchBody: '打开应用刷新',
    },
    'zh-Hant': {
      subtitle: '倫敦禮拜時間',
      inline: 'Athan — 禮拜時間',
      rectTitle: 'ATHAN',
      rectSubtitle: '開啟以載入時間',
      staleTitle: '已過期',
      staleBody: '開啟應用程式重新整理',
      staleInline: 'Athan — 開啟重新整理時間',
      refreshLine: '開啟 Athan 重新整理',
      refreshLead: '開啟 Athan',
      refreshTail: '重新整理',
      catchBody: '開啟應用程式重新整理',
    },
    es: {
      subtitle: 'Horas de oración en Londres',
      inline: 'Athan — horas de oración',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Abre para cargar las horas',
      staleTitle: 'Desactualizado',
      staleBody: 'Abre la app para actualizar',
      staleInline: 'Athan — abre para actualizar',
      refreshLine: 'Abre Athan para actualizar',
      refreshLead: 'Abre Athan',
      refreshTail: 'para actualizar',
      catchBody: 'Abre la app para actualizar',
    },
    nl: {
      subtitle: 'Gebedstijden voor Londen',
      inline: 'Athan — gebedstijden',
      rectTitle: 'ATHAN',
      rectSubtitle: 'Open om tijden te laden',
      staleTitle: 'Verouderd',
      staleBody: 'Open de app om te vernieuwen',
      staleInline: 'Athan — open om te vernieuwen',
      refreshLine: 'Athan openen om te vernieuwen',
      refreshLead: 'Athan openen',
      refreshTail: 'om te vernieuwen',
      catchBody: 'Open de app om te vernieuwen',
    },
  } as const;
  const deviceLocale = (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale ?? '';
  // Decision 9's zh mapping, the resolver's own rule: a zh tag with no script
  // subtag resolves by region, TW, HK and MO reading Traditional (CLDR's
  // likely-subtags answer) and every other zh tag Simplified. Script-tagged
  // locales already matched the list above, and yue is its own language code
  // and never matches zh
  const zhKeyFor = (tag: string): 'zh-Hans' | 'zh-Hant' | undefined =>
    tag === 'zh' || tag.startsWith('zh-')
      ? ['TW', 'HK', 'MO'].includes(tag.split('-')[1] ?? '')
        ? 'zh-Hant'
        : 'zh-Hans'
      : undefined;
  const localeKey =
    (
      [
        'en',
        'ar',
        'ms',
        'so',
        'hi',
        'th',
        'id',
        'tr',
        'fr',
        'uz',
        'sw',
        'ha',
        'pt',
        'ur',
        'fa',
        'bn',
        'ru',
        'az',
        'de',
        'sq',
        'bs',
        'ps',
        'ta',
        'ml',
        'zh-Hans',
        'zh-Hant',
        'es',
        'nl',
      ] as const
    ).find((code) => deviceLocale === code || deviceLocale.startsWith(`${code}-`)) ?? zhKeyFor(deviceLocale);
  const staticRow = STATIC[localeKey ?? 'en'];

  // Neutral fallbacks for states without renderable data: the gallery/jiggle
  // placeholder (iOS invokes the layout with no props) and any unexpected
  // rendering error (caught below). Text-only — no icons anywhere.
  const neutralForFamily = () => {
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {staticRow.inline}
        </Text>
      );
    }

    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {staticRow.rectTitle}
        </Text>
        <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
          {staticRow.rectSubtitle}
        </Text>
      </VStack>
    );
  };

  // Placeholder path: props are entirely absent (gallery preview, jiggle
  // mode, or a first-add before the app has ever pushed a timeline).
  if (props == null) {
    return neutralForFamily();
  }

  try {
    // Entries from an older app version missing segment bounds degrade to the
    // refresh card rather than rendering a broken countdown.
    const segmentValid = typeof props.nextEpochMs === 'number' && typeof props.prevEpochMs === 'number';
    if (props.stale === true || !segmentValid) {
      if (environment.widgetFamily === 'accessoryInline') {
        return (
          <Text
            modifiers={[
              font({ size: 14, weight: 'medium' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              containerBackground('rgba(0, 0, 0, 0)', 'widget'),
            ]}>
            {staticRow.staleInline}
          </Text>
        );
      }

      // accessoryRectangular — the moon-and-stars mark (the home widget's
      // stale-card icon, rendered here in the system's vibrant monochrome)
      // above the out-of-date title and refresh call
      return (
        <VStack
          spacing={1}
          modifiers={[
            containerRelativeFrame({ axes: 'horizontal' }),
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          <Image systemName='moon.stars.fill' size={18} color={WHITE} />
          <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle(WHITE), lineLimit(1)]}>
            {staticRow.staleTitle}
          </Text>
          <Text modifiers={[font({ size: 15, weight: 'medium' }), foregroundStyle(WHITE), lineLimit(1)]}>
            {staticRow.staleBody}
          </Text>
        </VStack>
      );
    }

    // iOS ticks Text(timerInterval:) itself, every second, with no timeline
    // entry behind it. The swift-ui types only describe the string form, so
    // the timer props ride this cast.
    const TickingTextEl = Text as unknown as (elementProps: {
      timerInterval?: { lower: Date; upper: Date };
      countsDown?: boolean;
      modifiers?: unknown[];
    }) => ReactNode;

    const segment = { lower: new Date(props.prevEpochMs), upper: new Date(props.nextEpochMs) };

    // accessoryInline is a single system-rendered line and cannot hold a
    // ticking timer beside other text: SwiftUI stops updating a timer Text
    // the moment it is concatenated. The absolute time is the more useful
    // half in a slot this small, so inline carries that and no countdown.
    if (environment.widgetFamily === 'accessoryInline') {
      return (
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            foregroundStyle(WHITE),
            lineLimit(1),
            containerBackground('rgba(0, 0, 0, 0)', 'widget'),
          ]}>
          {props.nextName} {props.nextTime}
        </Text>
      );
    }

    // The timer is its own Text or it stops ticking.
    return (
      <VStack
        spacing={1}
        modifiers={[
          containerRelativeFrame({ axes: 'horizontal' }),
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          containerBackground('rgba(0, 0, 0, 0)', 'widget'),
        ]}>
        <HStack spacing={6}>
          <Text
            modifiers={[
              font({ size: 16, weight: 'medium' }),
              foregroundStyle(WHITE),
              lineLimit(1),
              minimumScaleFactor(0.88),
            ]}>
            {props.nextName}
          </Text>
          <Text
            modifiers={[
              font({ size: 16, weight: 'medium' }),
              monospacedDigit(),
              foregroundStyle(WHITE),
              lineLimit(1),
              minimumScaleFactor(0.88),
            ]}>
            {props.nextTime}
          </Text>
        </HStack>
        <TickingTextEl
          timerInterval={segment}
          countsDown
          modifiers={[
            font({ size: 16, weight: 'medium' }),
            monospacedDigit(),
            multilineTextAlignment('center'),
            foregroundStyle(WHITE_MUTED),
            lineLimit(1),
            minimumScaleFactor(0.88),
          ]}
        />
      </VStack>
    );
  } catch {
    // Never let a rendering error blank the Lock Surface.
    return neutralForFamily();
  }
};

// One layout, two kinds: identical rendering, different timelines — the
// standard pair and the extras pair (see widgets/PrayerWidget.tsx).
export const PrayerLockWidget3 = createWidget('PrayerLockWidget3', AthanLockWidgetStacked);
export const ExtrasLockWidget3 = createWidget('ExtrasLockWidget3', AthanLockWidgetStacked);
