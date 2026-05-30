import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  cancelInvitation,
  createInvitation,
  listInvitations,
  type PendingInvitation,
} from '../../src/api/invitations';
import { listMembers, type PtEvent, type TrainerMemberItem } from '../../src/api/trainers';
import { useSessionStore } from '../../src/auth/session';
import { BannerStack } from '../../src/components/banner-stack';
import { InviteModal } from '../../src/components/members/InviteModal';
import { QrModal } from '../../src/components/members/QrModal';
import { usePtEvents } from '../../src/events/use-pt-events';

import type { BannerItem } from '../../src/events/banner-store';

// PT "Üyeler" sekmesi (TASK-1.31). Tek scrollable liste, iki başlık: üstte
// "Bekleyen davetler" (varsa — PT aksiyon alabilir: paylaş / iptal), altta
// "Aktif üyeler". Her iki liste boşsa büyük boş-durum CTA. "+ Üye davet et" →
// POST /invitations → davet modal'ı (kopyala / QR / kapat). Focus'ta + pull ile
// yenilenir. Access token oturum store'undan gelir (TASK-1.33 öncesi bellek-içi).

const DAY_MS = 24 * 60 * 60 * 1000;
/** Yeni katılan üyenin satırının highlight'lı kalma süresi (ms). */
const HIGHLIGHT_MS = 1_000;

/** Davetin bitmesine kalan tam gün (negatifse 0). */
function daysRemaining(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / DAY_MS));
}

type LoadStatus = 'loading' | 'ready' | 'error';
type ActionError = 'none' | 'create' | 'cancel';
type ModalState = { visible: boolean; invitation: PendingInvitation | null };

const CLOSED_MODAL: ModalState = { visible: false, invitation: null };

export default function MembersScreen() {
  const { t } = useTranslation('members');
  const router = useRouter();
  const accessToken = useSessionStore((s) => s.accessToken);

  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [members, setMembers] = useState<TrainerMemberItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<ActionError>('none');
  const [inviteModal, setInviteModal] = useState<ModalState>(CLOSED_MODAL);
  const [qrModal, setQrModal] = useState<ModalState>(CLOSED_MODAL);
  // Davet kabul banner'ı sonrası yeni üye satırını ~1sn vurgular.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!accessToken) {
        setStatus('error');
        return;
      }
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setStatus('loading');
      }
      const [invRes, memRes] = await Promise.all([
        listInvitations(accessToken),
        listMembers(accessToken),
      ]);
      if (invRes.kind === 'ok' && memRes.kind === 'ok') {
        setInvitations(invRes.invitations);
        setMembers(memRes.members);
        setStatus('ready');
      } else {
        setStatus('error');
      }
      setRefreshing(false);
    },
    [accessToken],
  );

  // Sekmeye her dönüşte (focus) + ilk açılışta yenile.
  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  // Yeni üyeyi geçici olarak vurgula (önceki timer'ı iptal et → üst üste binmesin).
  const highlight = useCallback((memberId: string) => {
    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
    }
    setHighlightId(memberId);
    highlightTimer.current = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
  }, []);

  useEffect(
    () => () => {
      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current);
      }
    },
    [],
  );

  // Davet kabul event'leri (in-app polling). Yeni event → liste tazele + vurgula.
  const onNewEvents = useCallback(
    (events: PtEvent[]) => {
      void load('refresh');
      const latest = events[0];
      if (latest) {
        highlight(latest.memberId);
      }
    },
    [load, highlight],
  );
  usePtEvents({ accessToken, onNewEvents });

  // Banner'a dokununca: listeyi tazele + ilgili üyeyi vurgula (tek tab — odak yeterli).
  const onBannerPress = useCallback(
    (banner: BannerItem) => {
      void load('refresh');
      highlight(banner.memberId);
    },
    [load, highlight],
  );

  const handleCreate = useCallback(async () => {
    if (!accessToken || creating) {
      return;
    }
    setCreating(true);
    setActionError('none');
    const res = await createInvitation(accessToken);
    setCreating(false);
    if (res.kind === 'created') {
      setInvitations((prev) => [res.invitation, ...prev]);
      setInviteModal({ visible: true, invitation: res.invitation });
    } else {
      setActionError('create');
    }
  }, [accessToken, creating]);

  const handleCancel = useCallback(
    async (id: string) => {
      if (!accessToken) {
        return;
      }
      setActionError('none');
      const res = await cancelInvitation(id, accessToken);
      // network/unauthorized → düzelmez, uyarı. Diğer durumlarda (cancelled /
      // not_found / not_cancellable) sunucu gerçeğini yansıtmak için listeyi tazele.
      if (res.kind === 'network' || res.kind === 'unauthorized') {
        setActionError('cancel');
        return;
      }
      void load('refresh');
    },
    [accessToken, load],
  );

  const openShare = useCallback((invitation: PendingInvitation) => {
    setInviteModal({ visible: true, invitation });
  }, []);

  const showQr = useCallback((invitation: PendingInvitation) => {
    setInviteModal(CLOSED_MODAL);
    setQrModal({ visible: true, invitation });
  }, []);

  if (status === 'loading') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  const isEmpty = invitations.length === 0 && members.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor="#9AA3B2"
          />
        }
      >
        <Text style={styles.screenTitle} accessibilityRole="header">
          {t('title')}
        </Text>

        {status === 'error' ? (
          <View style={styles.notice}>
            <Text style={styles.errorText} accessibilityRole="alert">
              {accessToken ? t('error.load') : t('error.session')}
            </Text>
          </View>
        ) : null}

        {actionError !== 'none' ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {actionError === 'create' ? t('error.create') : t('error.cancel')}
          </Text>
        ) : null}

        {isEmpty && status === 'ready' ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>{t('empty.title')}</Text>
            <Text style={styles.emptySubtitle}>{t('empty.subtitle')}</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => void handleCreate()}
              disabled={creating}
              accessibilityRole="button"
              accessibilityLabel={t('empty.cta')}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryLabel}>{t('empty.cta')}</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {!isEmpty && status === 'ready' ? (
          <>
            <Pressable
              style={styles.inviteCta}
              onPress={() => void handleCreate()}
              disabled={creating}
              accessibilityRole="button"
              accessibilityLabel={t('invite.cta')}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryLabel}>{t('invite.cta')}</Text>
              )}
            </Pressable>

            {invitations.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  {t('section.pending')}
                </Text>
                {invitations.map((inv) => {
                  const days = daysRemaining(inv.expiresAt);
                  return (
                    <View key={inv.id} style={styles.row}>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>{inv.code}</Text>
                        <Text style={styles.rowSubtitle}>
                          {days === 0
                            ? t('pending.expiresToday')
                            : t('pending.expiresIn', { days })}
                        </Text>
                      </View>
                      <View style={styles.rowActions}>
                        <Pressable
                          onPress={() => openShare(inv)}
                          accessibilityRole="button"
                          accessibilityLabel={`${t('pending.share')} ${inv.code}`}
                        >
                          <Text style={styles.linkLabel}>{t('pending.share')}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => void handleCancel(inv.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${t('pending.cancel')} ${inv.code}`}
                        >
                          <Text style={styles.cancelLabel}>{t('pending.cancel')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {t('section.active')}
              </Text>
              {members.length > 0 ? (
                members.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.row, m.id === highlightId ? styles.rowHighlight : null]}
                    onPress={() =>
                      router.push(
                        `/member/${m.id}?firstName=${encodeURIComponent(m.firstName)}&lastName=${encodeURIComponent(m.lastName)}&joinedAt=${encodeURIComponent(m.joinedAt)}`,
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${m.firstName} ${m.lastName} detayına git`}
                  >
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTitle}>
                        {m.firstName} {m.lastName}
                      </Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.rowSubtitle}>{t('active.empty')}</Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      <InviteModal
        visible={inviteModal.visible}
        invitation={inviteModal.invitation}
        onClose={() => setInviteModal(CLOSED_MODAL)}
        onShowQr={showQr}
      />
      <QrModal
        visible={qrModal.visible}
        url={qrModal.invitation?.url ?? null}
        code={qrModal.invitation?.code ?? null}
        onClose={() => setQrModal(CLOSED_MODAL)}
      />

      <BannerStack onBannerPress={onBannerPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },
  inviteCta: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'stretch',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyBlock: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9AA3B2',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#C7CEDB',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151922',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rowHighlight: {
    backgroundColor: '#1E2A3D',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rowSubtitle: {
    color: '#9AA3B2',
    fontSize: 13,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  linkLabel: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelLabel: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
  },
  notice: {
    marginBottom: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
