import { fireEvent, waitFor } from '@testing-library/react-native';

import { i18n, renderWithProviders } from '../../test/render-with-providers';

import { AUTO_DISMISS_MS, InAppBanner } from './in-app-banner';

const banner = {
  id: 'm1:2026-05-30T10:00:00.000Z',
  memberId: 'm1',
  memberFirstName: 'Ayşe',
  occurredAt: '2026-05-30T10:00:00.000Z',
};

const message = i18n.t('notifications:invitationAccepted', { name: 'Ayşe' });
const dismissLabel = i18n.t('notifications:dismiss');

describe('InAppBanner', () => {
  it('mesajı render eder + dokununca onPress(banner) çağrılır', () => {
    const onPress = jest.fn();
    const onDismiss = jest.fn();
    const { getByText } = renderWithProviders(
      <InAppBanner banner={banner} onPress={onPress} onDismiss={onDismiss} />,
    );

    expect(getByText(message)).toBeOnTheScreen();
    fireEvent.press(getByText(message));
    expect(onPress).toHaveBeenCalledWith(banner);
  });

  it('"X" kapatma → onDismiss(id) çağrılır', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <InAppBanner banner={banner} onPress={jest.fn()} onDismiss={onDismiss} />,
    );

    fireEvent.press(getByLabelText(dismissLabel));
    expect(onDismiss).toHaveBeenCalledWith(banner.id);
  });

  it('AUTO_DISMISS_MS sonra kendiliğinden onDismiss çağrılır', async () => {
    jest.useFakeTimers();
    try {
      const onDismiss = jest.fn();
      renderWithProviders(
        <InAppBanner banner={banner} onPress={jest.fn()} onDismiss={onDismiss} />,
      );
      expect(onDismiss).not.toHaveBeenCalled();
      jest.advanceTimersByTime(AUTO_DISMISS_MS);
      await waitFor(() => expect(onDismiss).toHaveBeenCalledWith(banner.id));
    } finally {
      jest.useRealTimers();
    }
  });
});
