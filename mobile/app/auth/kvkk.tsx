import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// KVKK rıza ekranı — SMS OTP verify sonrası, profil formundan önce (TASK-1.29
// akış sırası). İki ayrı tickbox: (1) KVKK aydınlatma onayı ZORUNLU (hesap
// açmaya engel), (2) sağlık verisi açık rızası OPSİYONEL (KVKK Madde 6 ayrı
// açık rıza). Metin placeholder — Yakın 5 öncesi hukuki review'lı dolacak,
// sadece i18n string güncellenir, mimari sabit kalır.
//
// Consent backend'e burada gönderilmez: profil oluşturma endpoint'i
// (TASK-1.20 POST /auth/profile) consent'leri payload olarak alır. Bu task'ta
// state taşıması navigation parametreleriyle yapılır (henüz onboarding store
// altyapısı yok; store kararı ayrı task/onay konusu). ConsentRecord audit
// kaydı TASK-1.14 helper'ı ile profil adımında yazılır.

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  return (
    <Pressable
      style={styles.checkboxRow}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export default function KvkkConsentScreen() {
  const { t } = useTranslation('kvkk');
  const router = useRouter();
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [healthChecked, setHealthChecked] = useState(false);

  // Sadece zorunlu KVKK aydınlatma onayı "Devam"ı aktive eder. Sağlık verisi
  // rızası opsiyonel — durumdan bağımsız.
  const canContinue = kvkkChecked;

  function handleContinue() {
    if (!canContinue) {
      return;
    }
    router.push({
      pathname: '/auth/profile',
      params: {
        kvkkConsent: 'true',
        healthConsent: healthChecked ? 'true' : 'false',
        kvkkTextVersion: t('textVersion'),
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {t('title')}
      </Text>
      <Text style={styles.subtitle}>{t('subtitle')}</Text>

      <ScrollView style={styles.textArea} contentContainerStyle={styles.textAreaContent}>
        <Text style={styles.bodyText} accessibilityRole="text">
          {t('aydinlatmaMetni')}
        </Text>
      </ScrollView>

      <Checkbox
        checked={kvkkChecked}
        onToggle={() => setKvkkChecked((prev) => !prev)}
        label={t('checkboxes.kvkk')}
      />
      <Checkbox
        checked={healthChecked}
        onToggle={() => setHealthChecked((prev) => !prev)}
        label={t('checkboxes.saglik')}
      />

      <Text style={styles.infoText}>{t('infoOptional')}</Text>

      <Pressable
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        onPress={handleContinue}
        disabled={!canContinue}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canContinue }}
        accessibilityLabel={t('cta')}
      >
        <Text style={styles.ctaLabel}>{t('cta')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
    backgroundColor: '#0F1115',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9AA3B2',
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 8,
    backgroundColor: '#151922',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  textAreaContent: {
    paddingVertical: 16,
  },
  bodyText: {
    color: '#C7CEDB',
    fontSize: 14,
    lineHeight: 21,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3A4150',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxBoxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  checkboxLabel: {
    flex: 1,
    color: '#E4E8EF',
    fontSize: 15,
    lineHeight: 21,
  },
  infoText: {
    color: '#9AA3B2',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  cta: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
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
