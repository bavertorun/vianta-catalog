import { siteConfig } from '@/config/site'

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-rule" />
      <p className="eyebrow">{siteConfig.heroEyebrow}</p>
      <h1>
        Görünmeyen bir
        <br />
        <em>{siteConfig.heroTitleItalic}</em> gibi.
      </h1>
      <p className="hero-copy">
        Seçili modeller. Özenle hazırlanmış seriler.
        <br />
        Vianta, özel satış ortakları için.
      </p>
      <a className="scroll-hint" href="#koleksiyon">
        <span>01</span>
        <span className="scroll-line" />
        <span>KEŞFET</span>
      </a>
    </section>
  )
}
