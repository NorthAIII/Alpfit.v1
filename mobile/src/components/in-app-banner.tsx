// In-app banner (TASK-1.32). Üst kenarda kayarak görünen, kendiliğinden kapanan
// bildirim kartı. PT uygulama açıkken üye davet kabul ettiğinde gösterilir:
// "[İsim] davetini kabul etti". Tıklanırsa `onPress` (Üyeler listesine odak +
// highlight), "X" ile `onDismiss`. `AUTO_DISMISS_MS` sonra kendiliğinden kapanır.
//
// Push DEĞİL — yalnızca foreground in-app katman. Görsel: slide-down + fade.

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import type { BannerItem } from '../events/banner-store';

/** Banner'ın ekranda kalış süresi (ms) — sonra kendiliğinden kapanır. */
export const AUTO_DISMISS_MS = 4_000;

interface InAppBannerProps {
  banner: BannerItem;
  onPress: (banner: BannerItem) => void;
  onDismiss: (id: string) => void;
}

export function InAppBanner({ banner, onPress, onDismiss }: InAppBannerProps) {
  const { t } = useTranslation('notifications');
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // useNativeDriver: false — opacity + translateY JS driver'la sürülür. Kısa
    // banner animasyonunda fark önemsiz; native driver test ortamında yok.
    Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
    const timeout = setTimeout(() => onDismiss(banner.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [slide, banner.id, onDismiss]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <Animated.View style={[styles.banner, { opacity: slide, transform: [{ translateY }] }]}>
      <Pressable
        style={styles.main}
        onPress={() => onPress(banner)}
        accessibilityRole="button"
        accessibilityLabel={t('invitationAccepted', { name: banner.memberFirstName })}
      >
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.message} numberOfLines={2}>
          {t('invitationAccepted', { name: banner.memberFirstName })}
        </Text>
      </Pressable>
      <Pressable
        style={styles.close}
        onPress={() => onDismiss(banner.id)}
        accessibilityRole="button"
        accessibilityLabel={t('dismiss')}
        hitSlop={8}
      >
        <Text style={styles.closeLabel}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2230',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3346',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  close: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  closeLabel: {
    color: '#9AA3B2',
    fontSize: 15,
    fontWeight: '700',
  },
});
