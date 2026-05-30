import { trUpper } from '@alpfit/shared';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fetchInvitationPreview } from '../src/api/invitations';
import { useOnboardingStore } from '../src/onboarding/store';

// Açılış ekranı (TASK-1.26). F1.1: "PT" / "Üyeyim" / "Davetim var" üç buton.
// Davet linkiyle gelen üye bu ekranı GÖRMEZ — deep link `app/davet/[code].tsx`
// önizleme yapıp doğrudan telefon ekranına devreder (bypass). Burası yalnızca
// elle giriş yolu: rol seçimi ya da davet kodunu manuel girme.

const CODE_LENGTH = 6;

/** Girişi ASCII alfanümeriğe indirger, TR-güvenli büyük harfe çevirir, 6'da keser. */
function normalizeInviteCode(raw: string): string {
  return trUpper(raw.replace(/[^a-zA-Z0-9]/g, '')).slice(0, CODE_LENGTH);
}

/** 6 karakteri okunur kılmak için ortadan böler: ABC123 → ABC-123. */
function maskInviteCode(code: string): string {
  return code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

type InviteStatus = 'idle' | 'checking' | 'error';

export default function LandingScreen() {
  const { t } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const router = useRouter();
  const selectRole = useOnboardingStore((s) => s.selectRole);
  const selectInvite = useOnboardingStore((s) => s.selectInvite);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<InviteStatus>('idle');

  const codeComplete = code.length === CODE_LENGTH;

  function goToPhone(role: 'pt' | 'member') {
    selectRole(role);
    router.push('/auth/phone');
  }

  function handleCodeChange(raw: string) {
    setCode(normalizeInviteCode(raw));
    // Kullanıcı yazmaya devam ederken eski hatayı temizle.
    setStatus('idle');
  }

  const submitCode = useCallback(() => {
    if (!codeComplete || status === 'checking') {
      return;
    }
    setStatus('checking');
    void fetchInvitationPreview(code).then((res) => {
      if (res.kind === 'valid') {
        selectInvite(code);
        router.push('/auth/phone');
        return;
      }
      // not_found / expired / cancelled / used / network → tek satır inline hata.
      // Manuel girişte ayrım kullanıcıya değer katmaz; "geçersiz ya da süresi
      // dolmuş" yeterli, çözüm aynı: PT'den yeni kod iste.
      setStatus('error');
    });
  }, [code, codeComplete, status, selectInvite, router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo} accessibilityRole="header">
          {t('app.name')}
        </Text>
        <Text style={styles.tagline}>{t('landing.tagline')}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => goToPhone('member')}
          accessibilityRole="button"
          accessibilityLabel={t('role.member')}
        >
          <Text style={styles.primaryLabel}>{t('role.member')}</Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={() => goToPhone('pt')}
          accessibilityRole="button"
          accessibilityLabel={t('role.trainer')}
        >
          <Text style={styles.primaryLabel}>{t('role.trainer')}</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setInviteOpen((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={t('role.invite')}
          accessibilityState={{ expanded: inviteOpen }}
        >
          <Text style={styles.secondaryLabel}>{t('role.invite')}</Text>
        </Pressable>

        {inviteOpen ? (
          <View style={styles.inviteSection}>
            <Text style={styles.inviteHint}>{t('landing.inviteHint')}</Text>
            <TextInput
              style={styles.codeInput}
              value={maskInviteCode(code)}
              onChangeText={handleCodeChange}
              placeholder={t('landing.invitePlaceholder')}
              placeholderTextColor="#5A6373"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={CODE_LENGTH + 1}
              accessibilityLabel={t('landing.inviteCodeLabel')}
            />

            {status === 'error' ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {tErrors('invitation_invalid')}
              </Text>
            ) : null}

            <Pressable
              style={[styles.submitButton, !codeComplete && styles.submitDisabled]}
              onPress={submitCode}
              disabled={!codeComplete || status === 'checking'}
              accessibilityRole="button"
              accessibilityState={{ disabled: !codeComplete || status === 'checking' }}
              accessibilityLabel={t('landing.inviteSubmit')}
            >
              {status === 'checking' ? (
                <View style={styles.submitInline}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.submitLabel}>{t('landing.checking')}</Text>
                </View>
              ) : (
                <Text style={styles.submitLabel}>{t('landing.inviteSubmit')}</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
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
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#9AA3B2',
    fontSize: 15,
    marginTop: 8,
  },
  actions: {
    gap: 14,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: '#E4E8EF',
    fontSize: 16,
    fontWeight: '500',
  },
  inviteSection: {
    marginTop: 8,
    gap: 12,
  },
  inviteHint: {
    color: '#9AA3B2',
    fontSize: 13,
    lineHeight: 19,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
    backgroundColor: '#151922',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    paddingVertical: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#2A2F3A',
  },
  submitInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
