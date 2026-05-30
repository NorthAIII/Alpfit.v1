// VideoModal bileşeni testi.
// react-native-webview mock'lanır (native modül, Jest'te çalışmaz).
// toEmbedUrl util fonksiyonu ayrıca test edilir.

import { fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '../../test/render-with-providers';

import { VideoModal, toEmbedUrl } from './VideoModal';

// WebView mock: props'ları kaydederek render eder
let lastWebViewProps: Record<string, unknown> = {};

jest.mock('react-native-webview', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WebView: (props: any) => {
    lastWebViewProps = props as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return <View testID={props.testID ?? 'video-webview'} />;
  },
}));

describe('toEmbedUrl', () => {
  it('watch?v= formatını embed URL\'e dönüştürür', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('watch?v= ile birlikte başka parametre varsa da çalışır', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?t=10&v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('youtu.be/ kısa URL formatını embed URL\'e dönüştürür', () => {
    expect(toEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('tanınmayan format → null döner', () => {
    expect(toEmbedUrl('https://vimeo.com/123456')).toBeNull();
  });

  it('boş string → null döner', () => {
    expect(toEmbedUrl('')).toBeNull();
  });
});

describe('VideoModal', () => {
  const onClose = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('isVisible=false iken modal render edilmez (içerik görünmez)', () => {
    const { queryByTestId } = renderWithProviders(
      <VideoModal isVisible={false} videoUrl="https://youtu.be/dQw4w9WgXcQ" onClose={onClose} />,
    );
    expect(queryByTestId('video-webview')).toBeNull();
  });

  it('geçerli YouTube URL ile WebView render edilir', () => {
    const { getByTestId } = renderWithProviders(
      <VideoModal isVisible={true} videoUrl="https://youtu.be/dQw4w9WgXcQ" onClose={onClose} />,
    );
    expect(getByTestId('video-webview')).toBeOnTheScreen();
  });

  it('geçersiz URL → hata mesajı gösterilir (WebView yok)', () => {
    const { getByTestId, queryByTestId, getByText } = renderWithProviders(
      <VideoModal isVisible={true} videoUrl="https://vimeo.com/12345" onClose={onClose} />,
    );
    expect(getByTestId('video-error')).toBeOnTheScreen();
    expect(getByText('Video şu an oynamıyor — PT\'ne bildir')).toBeOnTheScreen();
    expect(queryByTestId('video-webview')).toBeNull();
  });

  it('"✕" butonuna basılınca onClose çağrılır', () => {
    const { getByTestId } = renderWithProviders(
      <VideoModal isVisible={true} videoUrl="https://youtu.be/dQw4w9WgXcQ" onClose={onClose} />,
    );
    fireEvent.press(getByTestId('video-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('iOS inline flags: allowsInlineMediaPlayback + mediaPlaybackRequiresUserAction=false WebView\'e iletilir', () => {
    renderWithProviders(
      <VideoModal isVisible={true} videoUrl="https://youtu.be/dQw4w9WgXcQ" onClose={() => undefined} />,
    );
    expect(lastWebViewProps['allowsInlineMediaPlayback']).toBe(true);
    expect(lastWebViewProps['mediaPlaybackRequiresUserAction']).toBe(false);
  });
});
