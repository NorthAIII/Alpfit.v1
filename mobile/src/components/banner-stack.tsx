// Banner yığını (TASK-1.32). `banner-store`'daki görünür banner'ları üst üste
// binmeyecek şekilde sıralı render eder; kapasiteyi aşan banner'lar için "+N daha"
// rozeti gösterir. PT ekranlarının üstünde absolute overlay olarak konumlanır.
//
// Şu an yalnızca tek tab (Üyeler) var; bu nedenle `members.tsx` içinde mount
// edilir. İleride birden çok PT sekmesi olunca overlay tab layout'a taşınır.

import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useBannerStore, type BannerItem } from '../events/banner-store';

import { InAppBanner } from './in-app-banner';

/** Status bar + güvenli alan için sabit üst boşluk (ekranla aynı yaklaşım). */
const TOP_INSET = 56;

interface BannerStackProps {
  /** Banner'a dokununca (Üyeler listesine odak + yeni üye highlight). */
  onBannerPress: (banner: BannerItem) => void;
}

export function BannerStack({ onBannerPress }: BannerStackProps) {
  const visible = useBannerStore((s) => s.visible);
  const overflow = useBannerStore((s) => s.overflow);
  const dismiss = useBannerStore((s) => s.dismiss);
  const { t } = useTranslation('notifications');

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {visible.map((banner) => (
        <InAppBanner key={banner.id} banner={banner} onPress={onBannerPress} onDismiss={dismiss} />
      ))}
      {overflow > 0 ? (
        <View style={styles.overflowBadge}>
          <Text style={styles.overflowLabel}>{t('moreCount', { n: overflow })}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: TOP_INSET,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  overflowBadge: {
    alignSelf: 'center',
    backgroundColor: '#2A3346',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  overflowLabel: {
    color: '#C7CEDB',
    fontSize: 12,
    fontWeight: '600',
  },
});
