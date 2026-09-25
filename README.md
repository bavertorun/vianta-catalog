# Vianta Lingerie — Toptan Katalog

B2B showroom + sipariş listesi. Online ödeme yok; sipariş WhatsApp üzerinden tamamlanır.

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

Site: [http://localhost:3000](http://localhost:3000)  
Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Admin şifresi

Şifre proje içine yazılıdır. `.env` gerekmez.

## Ürün ekleme

1. `/admin` → şifre ile giriş
2. **Yeni ürün** → kod, fiyat, bedenler, görseller
3. Kaydet → `data/products.json` güncellenir
4. Görseller `public/products/{kod}-{n}.webp` olarak kaydedilir

JSON yedek: admin panelden **JSON dışa / içe aktar**.

## Seri mantığı

- Seçilen beden sayısı = seri adedi (ör. S·M·L → 3’lü seri)
- Fiyat = **bir serinin** toplam fiyatı
- Toplam parça = beden sayısı × seri adedi

## Deploy notları

- **Vercel:** Katalog okuma çalışır. Admin’de JSON/görsel **yazma** Vercel’de kalıcı değildir (read-only filesystem).
- Kalıcı yazma için:
  - VPS / Docker volume ile self-host, veya
  - Supabase / S3 + DB’ye geçiş
- WhatsApp numarası ve iletişim: `config/site.ts`

## Teknik

- Next.js App Router + TypeScript + Tailwind
- Zustand (persist) → sipariş listesi `localStorage`
- Framer Motion → ölçülü giriş animasyonları
- Veri: `data/products.json`
