import { formatTrPhone } from '@alpfit/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchDevOtp, isDevOtpLookupEnabled, sendOtp, verifyOtp } from '../../src/api/auth';
import { homePathForRole, persistLogin } from '../../src/auth/auth-actions';
import { OtpInput } from '../../src/auth/otp-input';
import { useOnboardingStore } from '../../src/onboarding/store';

// OTP girişi ekranı (TASK-1.29). Telefon ekranı (TASK-1.27) `POST /auth/otp/send`
// tetikleyip buraya yönlendirir; bu ekran 6 haneli kodu `POST /auth/otp/verify`
// ile doğrular. Verify sonucuna göre akış ayrışır:
//   - yeni üye   → kayıt jetonu store'a, KVKK rıza ekranına (TASK-1.28),
//   - mevcut üye → giriş; kalıcı oturum + ana ekran TASK-1.33'te kurulacak,
//     şimdilik köke (`/`) yönlendirilir (token persist YOK — bu task kapsamı dışı).
//
// Üç sayaç tek interval ile döner: kod geçerlilik (5dk), "yeniden gönder" kilidi
// (60sn), brute-force kilidi (423 → backend 15dk). Sayaçlar 0'a kadar azalır.

const OTP_TTL_SEC = 5 * 60;
const RESEND_DELAY_SEC = 60;
const OTP_LENGTH = 6;

type FeedbackError = 'none' | 'invalid' | 'expired' | 'network';

/** Saniyeyi `m:ss` biçimine çevirir (sayaç gösterimi). */
function formatClock(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function OtpEntryScreen() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const router = useRouter();
  const phone = useOnboardingStore((s) => s.phone);
  const setRegistrationToken = useOnboardingStore((s) => s.setRegistrationToken);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<FeedbackError>('none');
  const [expirySec, setExpirySec] = useState(OTP_TTL_SEC);
  const [resendSec, setResendSec] = useState(RESEND_DELAY_SEC);
  const [lockoutSec, setLockoutSec] = useState(0);

  // Tek interval üç sayacı birden azaltır (0'da durur) — fake timer testlerinde
  // de deterministik. Mount'ta bir kez kurulur.
  useEffect(() => {
    const id = setInterval(() => {
      setExpirySec((s) => (s > 0 ? s - 1 : 0));
      setResendSec((s) => (s > 0 ? s - 1 : 0));
      setLockoutSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const locked = lockoutSec > 0;
  const expired = !locked && (expirySec === 0 || error === 'expired');
  const inputDisabled = verifying || locked;

  const runVerify = useCallback(
    async (entered: string) => {
      if (!phone || verifying || locked || entered.length !== OTP_LENGTH) {
        return;
      }
      setVerifying(true);
      setError('none');

      const res = await verifyOtp(phone, entered);
      setVerifying(false);

      if (res.kind === 'registered') {
        setRegistrationToken(res.registrationToken);
        router.push('/auth/kvkk');
        return;
      }
      if (res.kind === 'logged_in') {
        // Mevcut kullanıcı girişi: jetonları kalıcılaştır (refresh → SecureStore,
        // 30 gün cihaz hatırlama) + rolü `GET /auth/me` ile öğren, role göre ana
        // ekrana git. Rol çözülemezse (ağ) jenerik hata göster, kutuları temizle.
        const role = await persistLogin({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        });
        if (role === null) {
          setCode('');
          setError('network');
          return;
        }
        router.replace(homePathForRole(role));
        return;
      }
      // Hata: kutuları temizle ki kullanıcı yeniden girebilsin.
      setCode('');
      if (res.kind === 'invalid_code') {
        setError('invalid');
      } else if (res.kind === 'expired') {
        setError('expired');
      } else if (res.kind === 'locked') {
        setLockoutSec(res.retryAfterSec);
      } else {
        setError('network');
      }
    },
    [phone, verifying, locked, setRegistrationToken, router],
  );

  function handleChange(next: string) {
    setCode(next);
    if (error !== 'none' && !locked) {
      setError('none');
    }
  }

  const canResend = !locked && resendSec === 0 && !resending && !verifying;

  const handleResend = useCallback(async () => {
    if (!phone || !canResend) {
      return;
    }
    setResending(true);
    const res = await sendOtp(phone);
    setResending(false);

    if (res.kind === 'sent') {
      setCode('');
      setError('none');
      setExpirySec(OTP_TTL_SEC);
      setResendSec(RESEND_DELAY_SEC);
      return;
    }
    if (res.kind === 'rate_limited') {
      setResendSec(res.retryAfterSec);
      return;
    }
    setError('network');
  }, [phone, canResend]);

  const handleDevLookup = useCallback(async () => {
    if (!phone) {
      return;
    }
    const res = await fetchDevOtp(phone);
    if (res.kind === 'ok') {
      setCode(res.code);
      void runVerify(res.code);
    }
  }, [phone, runVerify]);

  const feedback = locked
    ? tErrors('otp.locked', { time: formatClock(lockoutSec) })
    : expired
      ? tErrors('otp.expired')
      : error === 'invalid'
        ? tErrors('otp.invalid')
        : error === 'network'
          ? tErrors('network')
          : null;

  const resendLabel =
    resendSec > 0 ? t('otp.resendCountdown', { seconds: resendSec }) : t('otp.resend');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t('otp.title')}
        </Text>
        <Text style={styles.subtitle}>
          {t('otp.subtitle', { phone: phone ? formatTrPhone(phone) : '' })}
        </Text>
        <Text style={styles.hint}>{t('otp.hint')}</Text>
      </View>

      <OtpInput
        value={code}
        onChange={handleChange}
        onComplete={(entered) => void runVerify(entered)}
        disabled={inputDisabled}
        boxLabel={(index) => t('otp.boxLabel', { index })}
      />

      {verifying ? <ActivityIndicator style={styles.spinner} color="#3B82F6" /> : null}

      {!locked && !expired ? (
        <Text style={styles.timer}>{t('otp.expiresIn', { time: formatClock(expirySec) })}</Text>
      ) : null}

      {feedback ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {feedback}
        </Text>
      ) : null}

      <Pressable
        style={[styles.resend, !canResend && styles.resendDisabled]}
        onPress={() => void handleResend()}
        disabled={!canResend}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canResend }}
        accessibilityLabel={t('otp.resend')}
      >
        {resending ? (
          <ActivityIndicator color="#9AA3B2" />
        ) : (
          <Text style={[styles.resendLabel, canResend && styles.resendLabelActive]}>
            {resendLabel}
          </Text>
        )}
      </Pressable>

      {isDevOtpLookupEnabled() ? (
        <Pressable
          style={styles.devButton}
          onPress={() => void handleDevLookup()}
          accessibilityRole="button"
          accessibilityLabel={t('otp.devLookup')}
        >
          <Text style={styles.devLabel}>{t('otp.devLookup')}</Text>
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
  hint: {
    color: '#5A6373',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  spinner: {
    marginTop: 20,
  },
  timer: {
    color: '#9AA3B2',
    fontSize: 14,
    marginTop: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 20,
  },
  resend: {
    marginTop: 28,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendLabel: {
    color: '#9AA3B2',
    fontSize: 15,
    fontWeight: '600',
  },
  resendLabelActive: {
    color: '#3B82F6',
  },
  devButton: {
    marginTop: 'auto',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
  },
  devLabel: {
    color: '#5A6373',
    fontSize: 13,
    fontWeight: '600',
  },
});
