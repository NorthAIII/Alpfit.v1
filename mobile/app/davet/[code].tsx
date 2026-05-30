import { formatTrDate } from '@alpfit/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchInvitationPreview, type InvitationPreviewResult } from '../../src/api/invitations';

// Deep link landing ekranı (TASK-1.25). iOS Universal Link / Android App Link
// `https://<domain>/davet/{kod}` app yüklüyken bu route'u açar; kullanıcı app'i
// store'dan yeni kurduysa custom scheme `alpfit://davet/{kod}` aynı route'a düşer.
//
// Bu task'ta ekranın işi: davet kodunu route param'dan okumak, public
// `GET /invitations/:code` ile önizlemek (PT adı / geçerlilik), TR durum
// mesajlarını göstermek ve "Devam et" ile onboarding'e devretmek.
//
// KAPSAM NOTU — auth-state'e göre dallanma (üye → kabul, PT → hata, giriş
// yapılmamış → rol seçimi) TASK-1.26+'ya bağlı: henüz auth context/store ve rol
// seçim/kabul ekranları yok. "Devam et" şimdilik app girişine (`/`) yönlenir ve
// davet kodunu param olarak taşır; onboarding akışı kurulunca (TASK-1.26) kod
// oradan tüketilip kabul (`POST /invitations/:code/accept`, TASK-1.24) tetiklenir.

function normalizeCode(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) {
    return raw[0] ?? '';
  }
  return raw ?? '';
}

export default function DavetCodeScreen() {
  const { t } = useTranslation('davet');
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string }>();
  const code = normalizeCode(params.code);

  // null = yükleniyor; aksi halde önizleme sonucu.
  const [result, setResult] = useState<InvitationPreviewResult | null>(null);

  const load = useCallback(() => {
    let active = true;
    setResult(null);
    void fetchInvitationPreview(code).then((res) => {
      if (active) {
        setResult(res);
      }
    });
    return () => {
      active = false;
    };
  }, [code]);

  useEffect(() => load(), [load]);

  function handleContinue() {
    // TODO(TASK-1.26): onboarding rol seçimi/kabul akışı kurulunca buradan
    // tüketilecek. Şimdilik app girişine yönlenir, kod param olarak taşınır.
    router.push({ pathname: '/', params: { inviteCode: code } });
  }

  if (result === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#3B82F6" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (result.kind === 'valid') {
    const trainer = `${result.trainerFirstName} ${result.trainerLastName}`.trim();
    return (
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          {t('valid.title')}
        </Text>
        <Text style={styles.body}>{t('valid.subtitle', { trainer })}</Text>
        <Text style={styles.meta}>
          {t('valid.expires', { date: formatTrDate(new Date(result.expiresAt)) })}
        </Text>
        <Pressable
          style={styles.cta}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel={t('valid.cta')}
        >
          <Text style={styles.ctaLabel}>{t('valid.cta')}</Text>
        </Pressable>
      </View>
    );
  }

  // Hata/geçersizlik durumları — her biri kendi TR başlık + gövdesi.
  const errorKey = result.kind === 'not_found' ? 'notFound' : result.kind;
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {t(`error.${errorKey}.title`)}
      </Text>
      <Text style={styles.body}>{t(`error.${errorKey}.body`)}</Text>
      {result.kind === 'network' ? (
        <Pressable
          style={styles.cta}
          onPress={load}
          accessibilityRole="button"
          accessibilityLabel={t('error.network.retry')}
        >
          <Text style={styles.ctaLabel}>{t('error.network.retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 96,
    backgroundColor: '#0F1115',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  loadingText: {
    color: '#9AA3B2',
    fontSize: 14,
    marginTop: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  body: {
    color: '#C7CEDB',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  meta: {
    color: '#9AA3B2',
    fontSize: 13,
    marginBottom: 28,
  },
  cta: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
