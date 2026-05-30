// In-app banner kuyruğu (TASK-1.32). `use-pt-events` hook'u backend'den gelen
// PT event'lerini buraya `enqueue` eder; `banner-stack` görünür banner'ları
// buradan okur. Push YOK — bu yalnızca uygulama açıkken (foreground) gösterilen
// in-app bildirim katmanıdır.
//
// Tasarım:
//  - Dedup: aynı event (memberId:occurredAt) iki kez poll'lansa bile bir kez
//    gösterilir (`seenIds`). Backend strict-`>` cursor verir ama eşit-ms / focus
//    yeniden-mount durumlarına karşı istemci tarafı dedup ikinci güvencedir.
//  - Overflow: aynı anda çok hızlı kabul gelirse en fazla `MAX_VISIBLE` banner
//    gösterilir; gerisi `overflow` sayacına düşer ("+N daha" rozeti). Banner
//    kapatıldıkça yeni yer açılmaz — overflow yalnızca bilgilendirme sayacıdır
//    (üst sınır UI'yi banner yığınıyla boğmamak için).

import { create } from 'zustand';

import type { PtEvent } from '../api/trainers';

/** Aynı anda görünebilecek en fazla banner sayısı (gerisi overflow sayacına). */
export const MAX_VISIBLE = 5;

/** Görünür banner — event + dedup/anahtarlama için kararlı `id`. */
export interface BannerItem {
  id: string;
  memberId: string;
  memberFirstName: string;
  occurredAt: string;
}

export interface BannerState {
  visible: BannerItem[];
  /** Görünür kapasiteyi aşıp düşürülen banner sayısı ("+N daha"). */
  overflow: number;
  /** Daha önce gösterilmiş event id'leri (tekrar göstermeyi önler). */
  seenIds: Set<string>;

  /** Yeni event'leri kuyruğa ekler (dedup + overflow uygular). */
  enqueue: (events: PtEvent[]) => void;
  /** Tek banner'ı kapatır. */
  dismiss: (id: string) => void;
  /** Tüm kuyruğu + sayaçları + dedup setini sıfırlar (logout / yeniden başlangıç). */
  clear: () => void;
}

/** Event için kararlı id — aynı üyenin aynı kabul anı tek banner. */
function bannerId(event: PtEvent): string {
  return `${event.memberId}:${event.occurredAt}`;
}

const initial = (): Pick<BannerState, 'visible' | 'overflow' | 'seenIds'> => ({
  visible: [],
  overflow: 0,
  seenIds: new Set<string>(),
});

export const useBannerStore = create<BannerState>((set) => ({
  ...initial(),

  enqueue: (events) =>
    set((state) => {
      const seenIds = new Set(state.seenIds);
      const fresh: BannerItem[] = [];
      for (const event of events) {
        const id = bannerId(event);
        if (seenIds.has(id)) {
          continue;
        }
        seenIds.add(id);
        fresh.push({
          id,
          memberId: event.memberId,
          memberFirstName: event.memberFirstName,
          occurredAt: event.occurredAt,
        });
      }
      if (fresh.length === 0) {
        return { seenIds };
      }
      const combined = [...state.visible, ...fresh];
      const visible = combined.slice(0, MAX_VISIBLE);
      const overflow = state.overflow + (combined.length - visible.length);
      return { visible, overflow, seenIds };
    }),

  dismiss: (id) => set((state) => ({ visible: state.visible.filter((b) => b.id !== id) })),

  clear: () => set(initial()),
}));
