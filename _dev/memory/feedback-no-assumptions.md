# Feedback: Varsayım Yok — Her Sistem Değişikliğinde Onay İste

Hiçbir mimari karar, paket yükleme, dosya silme, dizin yapısı değişikliği, dış servis seçimi vs. **kullanıcı onayı olmadan** uygulanmaz. Acele yok.

**Why:** Kullanıcı teknik bilgisi zayıf — sessizce yapılan bir karar onun için "geri alamayacağı bir şey" demek. Geçmişte hızlı hareket eden ajanlar yanlış teknoloji seçimi yapmış. 2026-05-28 oturumunda kullanıcı bu kuralı açıkça yazdı.

**How to apply:**
- Birden fazla seçenek varsa: AskUserQuestion ile sun — her seçeneğin trade-off'unu TR ve sade dille açıkla.
- "Şunu yapayım mı?" sorusunu, "yapıyorum" yerine kullan.
- Bir komut / skill çalıştırmadan önce ne olacağını 1-2 cümlede açıkla, onay bekle.
- CONTEXT-BRIEF'te yazılı kararları değiştirme; sadece netleştirme / derinleştirme yap.
- Adım adım git — bir oturumda tek konu, bir mesajda tek karar.
