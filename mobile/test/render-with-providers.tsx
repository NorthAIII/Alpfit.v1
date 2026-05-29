// Custom render helper. Component test'leri bunu kullanır.
// Wrap'lediği provider'lar:
//   - I18nextProvider: TR namespace bundle'ları + missing-key warn
// Sonraki task'lar tema/auth/query provider ekledikçe buraya wrap eklenir.

import { render, type RenderOptions, type RenderResult } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';

import i18n from '../src/i18n/index';

import type { ReactElement, ReactNode } from 'react';

type ProviderProps = { children: ReactNode };

function AllProviders({ children }: ProviderProps) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { i18n };
