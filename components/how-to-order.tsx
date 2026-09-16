export function HowToOrder() {
  const steps = [
    'Katalogdan modelleri inceleyin',
    'Seri adedi seçip listeye ekleyin',
    'WhatsApp ile siparişi gönderin',
  ]

  return (
    <section className="how-section" aria-label="Nasıl sipariş verilir">
      <p className="eyebrow">NASIL SİPARİŞ VERİLİR</p>
      <ol className="how-steps">
        {steps.map((step, i) => (
          <li key={step}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
