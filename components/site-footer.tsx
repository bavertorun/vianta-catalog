import Link from 'next/link'
import { siteConfig } from '@/config/site'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <p className="wordmark wordmark-stacked">
          VIANTA
          <span>LINGERIE</span>
        </p>
        <p className="footer-note">{siteConfig.note}</p>
      </div>

      <div className="footer-grid">
        <div>
          <p className="eyebrow">İLETİŞİM</p>
          <p>
            <a href={`tel:+${siteConfig.whatsappNumber}`}>{siteConfig.contact.phone}</a>
          </p>
          <p>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </p>
          <p>
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
          </p>
        </div>
        <div>
          <p className="eyebrow">ADRES</p>
          <p>{siteConfig.contact.address}</p>
        </div>
        <div>
          <p className="eyebrow">ÇALIŞMA SAATLERİ</p>
          <ul className="hours-list">
            {siteConfig.contact.hours.map((row) => (
              <li key={row.day}>
                <span>{row.day}</span>
                <span>{row.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">SOSYAL</p>
          <p>
            <a href={siteConfig.contact.instagramUrl} target="_blank" rel="noopener noreferrer">
              {siteConfig.contact.instagram}
            </a>
          </p>
          <Link href="/#koleksiyon">Koleksiyon</Link>
        </div>
      </div>
    </footer>
  )
}
