// 6 kutulu OTP girişi (TASK-1.29). Kontrollü component: `value` 0-6 haneli
// string, her değişim parent'a `onChange` ile bildirilir; 6 hane dolunca bir
// kez `onComplete` çağrılır (auto-verify tetikler). Davranış:
//   - tek hane yazılınca otomatik bir sonraki kutuya geç,
//   - boş kutuda backspace → önceki kutuyu sil + odakla,
//   - 6 haneli yapıştırma / iOS oneTimeCode autofill kutulara dağıtılır.
//
// Doğrulama yok — yalnızca rakam kabul eder, format/anlam parent'ın işi.

import { useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete: (code: string) => void;
  /** Kilit / doğrulama sırasında girişi kapatır. */
  disabled?: boolean;
  /** Ekran okuyucu etiketi (1 tabanlı hane numarası alır). */
  boxLabel: (oneBasedIndex: number) => string;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  boxLabel,
}: OtpInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);

  function focusBox(index: number) {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    refs.current[clamped]?.focus();
  }

  function commit(next: string, focusIndex: number) {
    const clean = next.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(clean);
    focusBox(focusIndex);
    if (clean.length === OTP_LENGTH) {
      onComplete(clean);
    }
  }

  function handleChange(index: number, text: string) {
    const digits = text.replace(/\D/g, '');

    if (digits.length === 0) {
      // Kutu temizlendi → o haneyi çıkar, önceki kutuya dön.
      commit(value.slice(0, index) + value.slice(index + 1), index - 1);
      return;
    }

    if (digits.length === 1) {
      // Tek hane: index'e yaz, sonraki kutuya geç.
      commit(value.slice(0, index) + digits + value.slice(index + 1), index + 1);
      return;
    }

    // Çok hane: yapıştırma / autofill / dolu kutuya üst yazım. Dolu kutuya yazımda
    // ilk gelen rakam mevcut hanenin tekrarıdır → at, kalanı index'ten dağıt.
    const incoming = value[index] && digits[0] === value[index] ? digits.slice(1) : digits;
    const next = (value.slice(0, index) + incoming).slice(0, OTP_LENGTH);
    commit(next, next.length);
  }

  function handleKeyPress(index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    // Boş kutuda backspace → önceki haneyi sil + odakla (zincirleme silme).
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      commit(value.slice(0, index - 1) + value.slice(index), index - 1);
    }
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <TextInput
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          style={[styles.box, value[index] ? styles.boxFilled : null]}
          value={value[index] ?? ''}
          onChangeText={(text) => handleChange(index, text)}
          onKeyPress={(e) => handleKeyPress(index, e)}
          editable={!disabled}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          selectTextOnFocus
          accessibilityLabel={boxLabel(index + 1)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderColor: '#2A2F3A',
    borderRadius: 10,
    backgroundColor: '#151922',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  boxFilled: {
    borderColor: '#3B82F6',
  },
});
