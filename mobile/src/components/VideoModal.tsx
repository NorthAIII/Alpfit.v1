import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * YouTube video URL'sini embed URL'ine dönüştürür.
 * watch?v=VIDEO_ID  →  https://www.youtube.com/embed/VIDEO_ID
 * youtu.be/VIDEO_ID →  https://www.youtube.com/embed/VIDEO_ID
 * Tanınmayan format → null (▶ butonu ebeveyn tarafından zaten gizlenir).
 */
export function toEmbedUrl(videoUrl: string): string | null {
  const watchMatch = videoUrl.match(/[?&]v=([A-Za-z0-9_-]{10,12})/);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = videoUrl.match(/youtu\.be\/([A-Za-z0-9_-]{10,12})/);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return null;
}

interface VideoModalProps {
  isVisible: boolean;
  videoUrl: string;
  onClose: () => void;
}

export function VideoModal({ isVisible, videoUrl, onClose }: VideoModalProps) {
  const [hasError, setHasError] = useState(false);
  const embedUrl = toEmbedUrl(videoUrl);

  function handleClose() {
    setHasError(false);
    onClose();
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      testID="video-modal"
    >
      <View style={styles.container}>
        {/* Kapat butonu */}
        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Videoyu kapat"
          testID="video-modal-close"
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        {/* Video alanı */}
        {!embedUrl || hasError ? (
          <View style={styles.errorContainer} testID="video-error">
            <Text style={styles.errorText}>Video şu an oynamıyor — PT'ne bildir</Text>
          </View>
        ) : (
          <WebView
            source={{ uri: embedUrl }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            onError={() => setHasError(true)}
            style={styles.webview}
            testID="video-webview"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#9AA3B2',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
