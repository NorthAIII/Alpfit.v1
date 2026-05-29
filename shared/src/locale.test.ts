import { describe, expect, it } from 'vitest';

import { trLower, trUpper } from './locale.js';

describe('trLower', () => {
  it('İSTANBUL → istanbul (Türkçe büyük İ doğru çevrilir)', () => {
    expect(trLower('İSTANBUL')).toBe('istanbul');
  });

  it('İSTİKLAL → istiklal (çoklu İ)', () => {
    expect(trLower('İSTİKLAL')).toBe('istiklal');
  });

  it('İĞNE → iğne (özel TR karakterleri korur)', () => {
    expect(trLower('İĞNE')).toBe('iğne');
  });

  it('ASCII büyük harfler küçülür', () => {
    expect(trLower('HELLO')).toBe('hello');
  });

  it('boş string boş döner', () => {
    expect(trLower('')).toBe('');
  });

  it('zaten küçük string korunur', () => {
    expect(trLower('istanbul')).toBe('istanbul');
  });
});

describe('trUpper', () => {
  it('istanbul → İSTANBUL (Türkçe küçük i → büyük İ)', () => {
    expect(trUpper('istanbul')).toBe('İSTANBUL');
  });

  it('iğne → İĞNE', () => {
    expect(trUpper('iğne')).toBe('İĞNE');
  });

  it('ışık → IŞIK (noktasız ı → I)', () => {
    expect(trUpper('ışık')).toBe('IŞIK');
  });

  it('boş string boş döner', () => {
    expect(trUpper('')).toBe('');
  });

  it('zaten büyük string korunur', () => {
    expect(trUpper('İSTANBUL')).toBe('İSTANBUL');
  });
});

describe('trLower edge case — JS default davranışıyla farkı', () => {
  it('default toLowerCase İ → i + combining dot (U+0307); trLower temiz i', () => {
    const trResult = trLower('İ');
    expect(trResult).toBe('i');
    expect(trResult.length).toBe(1);
    expect(trResult.codePointAt(0)).toBe(0x69);
  });
});
