// Davet linki modal'ı (TASK-1.31). "+ Üye davet et" ya da bekleyen davet satırı
// "Linki paylaş" sonrası açılır. PT'ye 3 aksiyon sunar: linki panoya kopyala,
// QR kodu göster (yüz yüze paylaşım), kapat. Modal sade tutulur — kullanıcı
// yarıda iptal edebilsin (Karar Noktaları).

import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PendingInvitation } from '../../api/invitations';

interface InviteModalProps {
  visible: boolean;
  invitation: PendingInvitation | null;
  onClose: () => void;
  onShowQr: (invitation: PendingInvitation) => void;
}

export function InviteModal({ visible, invitation, onClose, onShowQr }: InviteModalProps) {
  const { t } = useTranslation('members');
  const [copied, setCopied] = useState(false);

  // Modal her açılışta "Kopyalandı" geri bildirimini sıfırla.
  useEffect(() => {
    if (visible) {
      setCopied(false);
    }
  }, [visible]);

  if (invitation === null) {
    return null;
  }

  async function handleCopy(url: string) {
    await Clipboard.setStringAsync(url);
    setCopied(true);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {t('invite.title')}
          </Text>
          <Text style={styles.subtitle}>{t('invite.subtitle')}</Text>

          <Text style={styles.codeLabel}>{t('invite.codeLabel')}</Text>
          <Text
            style={styles.code}
            accessibilityLabel={`${t('invite.codeLabel')}: ${invitation.code}`}
          >
            {invitation.code}
          </Text>
          <Text style={styles.url}>{invitation.url}</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => void handleCopy(invitation.url)}
            accessibilityRole="button"
            accessibilityLabel={t('invite.copy')}
          >
            <Text style={styles.primaryLabel}>
              {copied ? t('invite.copied') : t('invite.copy')}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => onShowQr(invitation)}
            accessibilityRole="button"
            accessibilityLabel={t('invite.qr')}
          >
            <Text style={styles.secondaryLabel}>{t('invite.qr')}</Text>
          </Pressable>

          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('invite.close')}
          >
            <Text style={styles.closeLabel}>{t('invite.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#151922',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9AA3B2',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  codeLabel: {
    color: '#C7CEDB',
    fontSize: 13,
    fontWeight: '600',
  },
  code: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
    marginVertical: 4,
  },
  url: {
    color: '#5A6373',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryLabel: {
    color: '#E4E8EF',
    fontSize: 15,
    fontWeight: '500',
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  closeLabel: {
    color: '#9AA3B2',
    fontSize: 15,
    fontWeight: '500',
  },
});
