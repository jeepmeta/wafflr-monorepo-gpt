import { ArrowRight, Heart, Users, Utensils } from 'lucide-react';

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8ed] text-[#30251f]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a className="flex items-center gap-2 text-2xl font-black tracking-tight" href="/">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-[#f6bd4b] text-xl">🧇</span>
          wafflr
        </a>
        <span className="rounded-full border border-[#eadcc8] px-4 py-2 text-sm font-semibold">A better way to decide</span>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-20">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
            <Heart size={16} className="text-[#e77955]" /> Less debating. More doing.
          </p>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Good plans start with <span className="text-[#df804e]">one good choice.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#74655a]">
            Get your people together, toss your options into the mix, and find something everyone can get excited about.
          </p>
          <button className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#30251f] px-6 py-4 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#4a3930]" type="button">
            Let’s make a decision <ArrowRight size={18} />
          </button>
          <p className="mt-4 text-sm text-[#8c7b6d]">A little less “I don’t know, what do you want?”</p>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -right-3 top-8 size-24 rounded-full bg-[#cce8d4] blur-2xl" />
          <div className="absolute -bottom-4 -left-4 size-28 rounded-full bg-[#f8d8c5] blur-2xl" />
          <div className="relative rotate-2 rounded-[2.5rem] border border-[#f0e1cf] bg-white p-5 shadow-2xl shadow-[#765b3d]/10">
            <div className="flex items-center justify-between px-2 pb-5">
              <div>
                <p className="text-sm font-semibold text-[#958477]">TONIGHT’S PICK</p>
                <p className="text-xl font-black">Where should we eat?</p>
              </div>
              <div className="grid size-11 place-items-center rounded-2xl bg-[#fff1cf]"><Users size={21} /></div>
            </div>
            <div className="rounded-[1.75rem] bg-[#f9e6d7] p-6 text-center">
              <div className="mx-auto grid aspect-square max-h-52 place-items-center rounded-[1.5rem] bg-gradient-to-br from-[#ffcf79] to-[#ed9865] text-8xl shadow-inner">🍕</div>
              <h2 className="mt-5 text-2xl font-black">Pizza night?</h2>
              <p className="mt-1 text-[#80695b]">Crispy edges. Melty cheese. Happy crew.</p>
              <div className="mt-5 flex justify-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-white text-2xl shadow-sm">👎</span>
                <span className="grid size-12 place-items-center rounded-full bg-[#cde8d4] text-2xl shadow-sm">💚</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pt-5 text-sm font-semibold text-[#8c7b6d]">
              <span>Round 1 of 3</span><span className="flex items-center gap-1"><Heart size={14} /> Made for your crew</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#eee0cf] bg-white/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-3">
          <Feature icon={<Users size={20} />} title="Bring your people" body="Share a room link and get everyone in the mix." />
          <Feature icon={<Utensils size={20} />} title="Add the options" body="Everyone contributes ideas worth considering." />
          <Feature icon={<Heart size={20} />} title="Find the favorite" body="Vote together and let the top pick rise." />
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-[#f0e3d3] bg-white p-6">
      <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-[#fff1cf]">{icon}</div>
      <h3 className="font-extrabold">{title}</h3>
      <p className="mt-2 leading-6 text-[#74655a]">{body}</p>
    </article>
  );
}
