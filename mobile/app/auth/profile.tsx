import { trUpper } from '@alpfit/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { acceptInvitation, createProfile } from '../../src/api/auth';
import { persistLogin } from '../../src/auth/auth-actions';
import { validateName } from '../../src/auth/profile-schema';
import { useOnboardingStore } from '../../src/onboarding/store';

// Profil oluşturma ekranı (TASK-1.30). Onboarding'in son adımı: OTP verify
// (yeni üye) → KVKK rıza (TASK-1.28) → BU EKRAN. Ortak form isim + soyisim;
// PT akışında ek opsiyonel alanlar (spor salonu + sertifika notu) görünür.
//
// "Hesabı oluştur" → `POST /auth/profile` (kayıt jetonu Bearer). 201'de
// `member_via_invite` akışında davet kabulü (`POST /invitations/:code/accept`)
// ardışık tetiklenir — network'te 3 deneme; terminal hatada üye yine içeri
// alınır (profil oluştu), "PT'nden yeni link iste" uyarısı gösterilir (Karar
// Noktaları). Kalıcı oturum (token persist) TASK-1.33; bu ekran köke değil
// `/home` placeholder'ına geçer (auth-gate'li yönlendirme TASK-1.33).
//
// KVKK rızaları KVKK ekranından route param ile gelir (store değil — consent
// onboarding'in geçici verisi, ekranlar arası tek sıçrama).

const ACCEPT_MAX_ATTEMPTS = 3;

type SubmitError = 'none' | 'phone_taken' | 'session' | 'invite_failed' | 'network';

export default function ProfileScreen() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const router = useRouter();

  const flow = useOnboardingStore((s) => s.flow);
  const invitationCode = useOnboardingStore((s) => s.invitationCode);
  const registrationToken = useOnboardingStore((s) => s.registrationToken);

  const params = useLocalSearchParams<{ kvkkConsent?: string; healthConsent?: string }>();
  const kvkkConsent = params.kvkkConsent === 'true';
  const healthConsent = params.healthConsent === 'true';

  const isPt = flow === 'pt';
  const role = isPt ? 'trainer' : 'member';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gymName, setGymName] = useState('');
  const [certificateNote, setCertificateNote] = useState('');
  // Alan blur edilince hata göster — yazarken "required" ile kullanıcıyı dürtme.
  const [firstTouched, setFirstTouched] = useState(false);
  const [lastTouched, setLastTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<SubmitError>('none');

  const firstError = useMemo(() => validateName(firstName), [firstName]);
  const lastError = useMemo(() => validateName(lastName), [lastName]);
  const canSubmit = firstError === null && lastError === null && !submitting;

  const goHome = useCallback(
    (name: string) => {
      // Trainer "Üyeler" sekmesine (isim param'ı yok), member home placeholder'ına
      // (karşılama için isim param'ı) gider.
      if (role === 'trainer') {
        router.replace('/members');
      } else {
        router.replace({ pathname: '/home', params: { name } });
      }
    },
    [router, role],
  );

  const runAccept = useCallback(async (code: string, accessToken: string) => {
    // network'te yeniden dene; terminal sonuç (connected/failed) hemen döner.
    let last = await acceptInvitation(code, accessToken);
    for (let attempt = 1; attempt < ACCEPT_MAX_ATTEMPTS && last.kind === 'network'; attempt += 1) {
      last = await acceptInvitation(code, accessToken);
    }
    return last;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }
    if (!registrationToken) {
      // Kayıt jetonu yoksa akış bozulmuş — baştan onboarding.
      setError('session');
      return;
    }
    setSubmitting(true);
    setError('none');

    const result = await createProfile({
      registrationToken,
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      kvkkConsent,
      healthConsent,
      ...(isPt && gymName.trim() ? { gymName: gymName.trim() } : {}),
      ...(isPt && certificateNote.trim() ? { certificateNote: certificateNote.trim() } : {}),
    });

    if (result.kind !== 'created') {
      setSubmitting(false);
      if (result.kind === 'phone_taken') {
        setError('phone_taken');
      } else if (result.kind === 'unauthorized' || result.kind === 'kvkk_required') {
        setError('session');
      } else {
        // invalid (UI inline zaten eler) + network → jenerik "tekrar dene".
        setError('network');
      }
      return;
    }

    const createdName = result.user.firstName;

    // Jetonları kalıcılaştır (refresh → SecureStore, 30 gün cihaz hatırlama) +
    // bellek oturumunu doldur. Rol formdan biliniyor (member/trainer). Bundan
    // sonra authenticated ekranlar (PT "Üyeler") oturum jetonuna erişir.
    await persistLogin(
      { accessToken: result.accessToken, refreshToken: result.refreshToken },
      role,
    );

    // Davet akışı: profil oluştu, şimdi PT'ye bağlan. Başarısızsa üye yine içeri
    // alınır (profil kalıcı) — sadece uyarı gösterilir, home'a manuel devam eder.
    if (flow === 'member_via_invite' && invitationCode) {
      const accepted = await runAccept(invitationCode, result.accessToken);
      setSubmitting(false);
      if (accepted.kind === 'connected') {
        goHome(createdName);
      } else {
        setError('invite_failed');
      }
      return;
    }

    setSubmitting(false);
    goHome(createdName);
  }, [
    canSubmit,
    registrationToken,
    role,
    firstName,
    lastName,
    kvkkConsent,
    healthConsent,
    isPt,
    gymName,
    certificateNote,
    flow,
    invitationCode,
    runAccept,
    goHome,
  ]);

  const showFirstError = firstTouched && firstError === 'invalid';
  const showLastError = lastTouched && lastError === 'invalid';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {t('profile.title')}
      </Text>
      <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>

      <View style={styles.avatarRow}>
        <Pressable
          style={styles.avatar}
          onPress={() => setError('none')}
          accessibilityRole="button"
          accessibilityLabel={t('profile.photo')}
        >
          <Text style={styles.avatarInitial}>{trUpper(firstName.trim().charAt(0)) || '+'}</Text>
        </Pressable>
        <Text style={styles.photoHint}>{t('profile.photoHint')}</Text>
      </View>

      <Text style={styles.label}>{t('profile.firstname')}</Text>
      <TextInput
        style={[styles.input, showFirstError && styles.inputError]}
        value={firstName}
        onChangeText={setFirstName}
        onBlur={() => setFirstTouched(true)}
        placeholder={t('profile.firstnamePlaceholder')}
        placeholderTextColor="#5A6373"
        autoComplete="name-given"
        maxLength={50}
        accessibilityLabel={t('profile.firstname')}
      />
      {showFirstError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {t('profile.nameError')}
        </Text>
      ) : null}

      <Text style={styles.label}>{t('profile.lastname')}</Text>
      <TextInput
        style={[styles.input, showLastError && styles.inputError]}
        value={lastName}
        onChangeText={setLastName}
        onBlur={() => setLastTouched(true)}
        placeholder={t('profile.lastnamePlaceholder')}
        placeholderTextColor="#5A6373"
        autoComplete="name-family"
        maxLength={50}
        accessibilityLabel={t('profile.lastname')}
      />
      {showLastError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {t('profile.nameError')}
        </Text>
      ) : null}

      {isPt ? (
        <>
          <Text style={styles.label}>{t('profile.gym')}</Text>
          <TextInput
            style={styles.input}
            value={gymName}
            onChangeText={setGymName}
            placeholder={t('profile.gymPlaceholder')}
            placeholderTextColor="#5A6373"
            maxLength={100}
            accessibilityLabel={t('profile.gym')}
          />

          <Text style={styles.label}>{t('profile.certNote')}</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={certificateNote}
            onChangeText={setCertificateNote}
            placeholder={t('profile.certNotePlaceholder')}
            placeholderTextColor="#5A6373"
            multiline
            numberOfLines={3}
            maxLength={500}
            accessibilityLabel={t('profile.certNote')}
          />
        </>
      ) : null}

      {error === 'phone_taken' ? (
        <View style={styles.notice}>
          <Text style={styles.errorText} accessibilityRole="alert">
            {t('profile.phoneTaken')}
          </Text>
          <Pressable
            onPress={() => router.replace('/auth/phone')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.loginCta')}
          >
            <Text style={styles.linkLabel}>{t('profile.loginCta')}</Text>
          </Pressable>
        </View>
      ) : null}

      {error === 'invite_failed' ? (
        <View style={styles.notice}>
          <Text style={styles.errorText} accessibilityRole="alert">
            {t('profile.inviteFailed')}
          </Text>
          <Pressable
            onPress={() => goHome(firstName.trim())}
            accessibilityRole="button"
            accessibilityLabel={t('profile.continueCta')}
          >
            <Text style={styles.linkLabel}>{t('profile.continueCta')}</Text>
          </Pressable>
        </View>
      ) : null}

      {error === 'session' ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {tErrors('auth.sessionExpired')}
        </Text>
      ) : null}

      {error === 'network' ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {tErrors('network')}
        </Text>
      ) : null}

      <Pressable
        style={[styles.cta, !canSubmit && styles.ctaDisabled]}
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
        accessibilityLabel={t('profile.cta')}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.ctaLabel}>{t('profile.cta')}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
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
    marginBottom: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1B2230',
    borderWidth: 1,
    borderColor: '#2A2F3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#9AA3B2',
    fontSize: 26,
    fontWeight: '700',
  },
  photoHint: {
    flex: 1,
    color: '#5A6373',
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: '#C7CEDB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
    backgroundColor: '#151922',
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#F87171',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    lineHeight: 20,
  },
  notice: {
    marginBottom: 8,
    gap: 8,
  },
  linkLabel: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
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
