// Custom render helper. Component test'leri bunu kullanır.
// Wrap'lediği provider'lar:
//   - QueryClientProvider: TanStack Query (her render'da taze instance — test izolasyonu)
//   - I18nextProvider: TR namespace bundle'ları + missing-key warn
// Sonraki task'lar tema/auth provider ekledikçe buraya wrap eklenir.

import { render, type RenderOptions, type RenderResult } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';

import i18n from '../src/i18n/index';

import type { ReactElement, ReactNode } from 'react';

type ProviderProps = { children: ReactNode };

function AllProviders({ children }: ProviderProps) {
  // Her render'da taze QueryClient: testler arası cache kirliliği olmaz.
  // retry: false — test ortamında retry bekleme süresi yok.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { i18n };
