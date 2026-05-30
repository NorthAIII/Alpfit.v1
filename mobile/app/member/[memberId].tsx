import { formatTrDate } from '@alpfit/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCreateProgram, useTrainerMemberProgram } from '../../src/hooks/useProgram';

// Üye mini-detay sayfası (TASK-2.07). M5'te tam PT Dashboard üye detayına dönüşür;
// şimdilik "Üyeler" sekmesinden builder'a açılan geçici giriş noktası.
// Üye verisi (ad, soyad, joinedAt) params üzerinden gelir — ek API çağrısı yok.
// Aktif program kontrolü: useTrainerMemberProgram → "Program yaz" / "Mevcut programı düzenle".

export default function MemberDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    memberId: string;
    firstName: string;
    lastName: string;
    joinedAt: string;
  }>();

  const { memberId, firstName, lastName, joinedAt } = params;
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  const joinedDate = joinedAt ? formatTrDate(new Date(joinedAt)) : '';

  const { data: program, isLoading } = useTrainerMemberProgram(memberId ?? '');

  const { mutate: doCreateProgram, isPending: isCreating } = useCreateProgram({
    memberId: memberId ?? '',
    onSuccess: (programId) => {
      router.push(
        `/program/${programId}?memberId=${encodeURIComponent(memberId ?? '')}&memberFirstName=${encodeURIComponent(firstName ?? '')}&memberLastName=${encodeURIComponent(lastName ?? '')}&programStatus=draft`,
      );
    },
  });

  const goToBuilder = (program: { id: string; status: string }) => {
    router.push(
      `/program/${program.id}?memberId=${encodeURIComponent(memberId ?? '')}&memberFirstName=${encodeURIComponent(firstName ?? '')}&memberLastName=${encodeURIComponent(lastName ?? '')}&programStatus=${program.status}`,
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Geri"
      >
        <Text style={styles.backLabel}>← Geri</Text>
      </Pressable>

      <Text style={styles.name} accessibilityRole="header">
        {fullName}
      </Text>
      <Text style={styles.joinedDate}>Üye oldu: {joinedDate}</Text>

      {isLoading ? (
        <ActivityIndicator color="#3B82F6" style={styles.loader} testID="member-detail-loading" />
      ) : (
        <View style={styles.actions}>
          {program ? (
            <>
              <Pressable
                style={styles.primaryButton}
                onPress={() => goToBuilder(program)}
                accessibilityRole="button"
                accessibilityLabel="Mevcut programı düzenle"
                testID="edit-program-button"
              >
                <Text style={styles.primaryLabel}>Mevcut programı düzenle</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.secondaryButton]}
                onPress={() => doCreateProgram()}
                disabled={isCreating}
                accessibilityRole="button"
                accessibilityLabel="Yeni program yaz"
                testID="new-program-button"
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryLabel}>Yeni program yaz</Text>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable
              style={styles.primaryButton}
              onPress={() => doCreateProgram()}
              disabled={isCreating}
              accessibilityRole="button"
              accessibilityLabel="Program yaz"
              testID="create-program-button"
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryLabel}>Program yaz</Text>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  backButton: {
    marginBottom: 24,
  },
  backLabel: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  joinedDate: {
    color: '#9AA3B2',
    fontSize: 14,
    marginBottom: 32,
  },
  loader: {
    marginTop: 24,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1E2A3D',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
