// Davet QR kod modal'ı (TASK-1.31). Davet URL'ini QR'a kodlar; yüz yüze
// paylaşımda üye telefon kamerasıyla okutur. Altında kod metni yedek olarak
// gösterilir (QR okunamazsa elle girilebilir).

import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QrModalProps {
  visible: boolean;
  url: string | null;
  code: string | null;
  onClose: () => void;
}

export function QrModal({ visible, url, code, onClose }: QrModalProps) {
  const { t } = useTranslation('members');

  if (url === null) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          {t('qr.title')}
        </Text>
        <Text style={styles.subtitle}>{t('qr.subtitle')}</Text>

        <View style={styles.qrWrap} accessibilityLabel={t('qr.imageLabel')}>
          <QRCode value={url} size={240} backgroundColor="#FFFFFF" />
        </View>

        {code !== null ? <Text style={styles.code}>{code}</Text> : null}

        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('qr.close')}
        >
          <Text style={styles.closeLabel}>{t('qr.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9AA3B2',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  qrWrap: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  code: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: 8,
  },
  closeButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
  },
  closeLabel: {
    color: '#E4E8EF',
    fontSize: 16,
    fontWeight: '600',
  },
});
