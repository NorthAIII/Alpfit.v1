import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { sendOtp } from '../../src/api/auth';
import {
  TR_DIAL_CODE,
  extractNationalDigits,
  maskTrNational,
  parseNationalTrPhone,
} from '../../src/auth/phone-mask';
import { Sentry } from '../../src/observability/sentry';
import { useOnboardingStore } from '../../src/onboarding/store';

// Telefon girişi ekranı (TASK-1.27). Akış: rol seçimi / davet (TASK-1.26) →
// BU EKRAN telefonu doğrular + `POST /auth/otp/send` tetikler → OTP ekranı
// (TASK-1.29). Yeni vs mevcut üye ayrımı BU EKRANDA YAPILMAZ — "telefon kayıtlı
// mı?" sızıntısını önlemek için (F1.1); ayrım OTP verify cevabındaki `isNew`
// ile sonraki ekranda yapılır.
//
// `+90` sabit ön ek olarak gösterilir; kullanıcı yalnızca 10 haneli ulusal
// numarayı yazar (`5XX XXX XX XX`). Inline doğrulama 50ms debounce ile yazarken
// kırmızı/yeşil feedback verir — debounce per-keystroke libphonenumber parse'ını
// seyreltir, input responsive kalır.

const INLINE_ERROR_MIN_DIGITS = 7;
const VALIDATION_DEBOUNCE_MS = 50;

type SubmitError = 'none' | 'invalid' | 'network';

export default function PhoneEntryScreen() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const router = useRouter();
  const setPhone = useOnboardingStore((s) => s.setPhone);

  // `national`: input'a yazılan ham ulusal rakamlar (anında, responsive).
  // `debounced`: 50ms gecikmeli kopya — doğrulama feedback'i buna bağlanır.
  const [national, setNational] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError>('none');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(national), VALIDATION_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [national]);

  // Rate limit countdown — saniyede bir azalır, 0'da durur.
  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const valid = useMemo(() => parseNationalTrPhone(debounced).valid, [debounced]);
  // 7+ hane yazıldı ama hâlâ geçerli TR mobil hat değil → inline kırmızı uyarı.
  const showInlineError =
    extractNationalDigits(debounced).length >= INLINE_ERROR_MIN_DIGITS && !valid;
  const rateLimited = countdown > 0;
  const canContinue = valid && !sending && !rateLimited;

  function handleChange(raw: string) {
    setNational(extractNationalDigits(raw));
    // Yeni girişte eski submit hatasını temizle (rate limit countdown'a dokunmaz).
    if (submitError !== 'none') {
      setSubmitError('none');
    }
  }

  const handleContinue = useCallback(async () => {
    const parsed = parseNationalTrPhone(national);
    if (!parsed.valid || sending || countdown > 0) {
      return;
    }
    setSending(true);
    setSubmitError('none');
    setPhone(parsed.e164);

    const res = await sendOtp(parsed.e164);
    setSending(false);

    if (res.kind === 'sent') {
      router.push('/auth/otp');
      return;
    }
    if (res.kind === 'rate_limited') {
      setCountdown(res.retryAfterSec);
      return;
    }
    if (res.kind === 'invalid_phone') {
      setSubmitError('invalid');
      return;
    }
    // network — telefon PII'sini İÇERMEYEN jenerik hata Sentry'ye (scrubber aktif).
    setSubmitError('network');
    Sentry.captureException(new Error('otp_send_network_error'));
  }, [national, sending, countdown, setPhone, router]);

  const submitMessage = rateLimited
    ? tErrors('rate_limit', { seconds: countdown })
    : submitError === 'network'
      ? tErrors('network')
      : submitError === 'invalid'
        ? t('phone.error.invalid')
        : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t('phone.title')}
        </Text>
        <Text style={styles.subtitle}>{t('phone.subtitle')}</Text>
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.dialCode}>{TR_DIAL_CODE}</Text>
        <TextInput
          style={[styles.input, valid && styles.inputValid, showInlineError && styles.inputError]}
          value={maskTrNational(national)}
          onChangeText={handleChange}
          placeholder={t('phone.placeholder')}
          placeholderTextColor="#5A6373"
          keyboardType="phone-pad"
          autoComplete="tel"
          autoCorrect={false}
          accessibilityLabel={t('phone.label')}
        />
      </View>

      {showInlineError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {t('phone.error.invalid')}
        </Text>
      ) : null}

      {submitMessage ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {submitMessage}
        </Text>
      ) : null}

      <Pressable
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        onPress={() => void handleContinue()}
        disabled={!canContinue}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canContinue }}
        accessibilityLabel={t('phone.cta')}
      >
        {sending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.ctaLabel}>{t('phone.cta')}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 32,
    backgroundColor: '#0F1115',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9AA3B2',
    fontSize: 15,
    lineHeight: 21,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dialCode: {
    color: '#E4E8EF',
    fontSize: 20,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
    backgroundColor: '#151922',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputValid: {
    borderColor: '#34D399',
  },
  inputError: {
    borderColor: '#F87171',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  cta: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  ctaDisabled: {
    backgroundColor: '#2A2F3A',
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
