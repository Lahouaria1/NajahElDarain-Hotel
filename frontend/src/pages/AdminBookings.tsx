// src/pages/About.tsx
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="pb-12">
      <section className="hero">
        <div className="hero-grad" />
        <div className="hero-copy">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Najah El Darain Hotel</h1>
          <p className="mt-2 text-sm sm:text-base text-white/90">
            En varm och personlig hotellupplevelse – nära stadens puls och lugna grönytor.
          </p>
        </div>
      </section>

      <div className="container-p mt-10 space-y-10">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold">Om oss</h2>
            <p className="mt-3 text-gray-700 leading-relaxed">
              Najah El Darain Hotel välkomnar både affärsresenärer, familjer och weekendgäster.
              Hos oss möts omtanke, komfort och stilren design – med fokus på god nattsömn,
              god service och smidiga lösningar under hela din vistelse.
            </p>
          </div>
          <aside className="card p-4">
            <h3 className="font-semibold">Snabbfakta</h3>
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              <li>✓ 24/7 reception</li>
              <li>✓ Gratis Wi-Fi</li>
              <li>✓ Frukost & restaurang</li>
              <li>✓ Gym & relax*</li>
              <li>✓ Mötesrum & event</li>
              <li className="text-xs text-gray-500">* i mån av tillgång</li>
            </ul>
          </aside>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-lg font-semibold">Vision & värderingar</h3>
            <ul className="mt-3 text-gray-700 space-y-2 text-sm">
              <li><strong>Gästfokus:</strong> Respekt, värme och flexibilitet.</li>
              <li><strong>Komfort:</strong> Tysta rum, sköna sängar, bra sömn.</li>
              <li><strong>Kvalitet:</strong> Rena, säkra och välskötta utrymmen.</li>
              <li><strong>Hållbarhet:</strong> Smarta energival och lokala samarbeten.</li>
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold">Våra rum</h3>
            <ul className="mt-3 text-gray-700 space-y-2 text-sm">
              <li><strong>Standardrum:</strong> 1–2 pers, skrivbord & snabb Wi-Fi.</li>
              <li><strong>Deluxerum:</strong> Extra utrymme, loungehörna, kaffe/te.</li>
              <li><strong>Familjerum:</strong> Plats för hela familjen (barnsäng vid behov).</li>
              <li><strong>Svit:</strong> Separat sovrum/vardagsrum, välkomstpaket.</li>
            </ul>
          </div>
        </section>

        <section className="card p-5">
          <h3 className="text-lg font-semibold">Tjänster & faciliteter</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-700">
            <ul className="space-y-2">
              <li>• Frukost med klassiskt & lokalt utbud</li>
              <li>• Restaurang & bar (säsongsmeny)</li>
              <li>• Room service (utvalda tider)</li>
              <li>• Gratis Wi-Fi i hela hotellet</li>
            </ul>
            <ul className="space-y-2">
              <li>• Gym & relax (bastu/ånga*)</li>
              <li>• Mötesrum & eventteknik</li>
              <li>• 24/7 reception & bagage</li>
              <li>• Tvätt/tvättservice</li>
            </ul>
            <ul className="space-y-2">
              <li>• Parkering/garage i närheten</li>
              <li>• Flygplatstransfer & taxi (förbokas)</li>
              <li>• Barnvänliga alternativ</li>
              <li>• Vegetariskt/veganskt utbud</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-lg font-semibold">Läget</h3>
            <p className="mt-3 text-gray-700 text-sm leading-relaxed">
              <strong>Adress:</strong> Gatuadress 1, 123 45 Stad<br />
              <strong>Avstånd:</strong> ~10 min till centralstationen · ~25 min till flygplatsen · nära sevärdheter och parker.
            </p>
            <Link to="/rooms" className="btn-primary mt-4 inline-flex">Se våra rum</Link>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold">Policy & tider</h3>
            <ul className="mt-3 text-gray-700 space-y-2 text-sm">
              <li><strong>Incheckning:</strong> från 15:00 · <strong>Utcheckning:</strong> till 11:00</li>
              <li><strong>Avbokning:</strong> gratis t.o.m. 24–48 h innan (beroende på pris).</li>
              <li><strong>Rökfritt:</strong> Hela hotellet är rökfritt.</li>
              <li><strong>Husdjur:</strong> [tillåts/tillåts ej].</li>
              <li><strong>Betalning:</strong> Kort (Visa/Mastercard/Amex) och [ev. kontanter].</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-lg font-semibold">Tillgänglighet</h3>
            <ul className="mt-3 text-gray-700 space-y-2 text-sm">
              <li>• Hiss, ramper och tillgänglig entré.</li>
              <li>• Anpassade rum (på förfrågan).</li>
              <li>• Hjälpmedel – meddela oss gärna i förväg.</li>
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold">Hållbarhet</h3>
            <ul className="mt-3 text-gray-700 space-y-2 text-sm">
              <li>• LED-belysning, vattenbesparing, källsortering.</li>
              <li>• Lokala leverantörer & minskat matsvinn.</li>
              <li>• Textilbyte enligt gästönskemål för att spara resurser.</li>
            </ul>
          </div>
        </section>

        <section className="card p-5">
          <h3 className="text-lg font-semibold">Kontakt</h3>
          <div className="mt-3 text-sm text-gray-700 space-y-1">
            <p><strong>Telefon:</strong> +46 (0)xx-xxx xx xx</p>
            <p><strong>E-post:</strong> info@najah-eldarain.example</p>
            <p><strong>Reception:</strong> Öppen dygnet runt.</p>
          </div>
          <a href="mailto:info@najah-eldarain.example" className="btn-primary mt-4 inline-flex">Kontakta oss</a>
        </section>
      </div>
    </div>
  );
}
