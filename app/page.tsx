import ExperienceLoader from '../components/ExperienceLoader';

export default function Home() {
  return (
    <>
      <ExperienceLoader />

      <header className="nav glass">
        <a className="brand" href="#top">Ayomide</a>
        <nav className="links" aria-label="Sections">
          <a href="#solidify">Process</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="btn btn-cta" href="#contact">Start a project</a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">
            <span>You bring the idea. I <em>ship</em> the product.</span>
          </h1>
          <div className="hero-sub">
            <span className="eyebrow">Famoyegun Ayomide · Fullstack product engineer</span>
            <p>Design, frontend and backend from one person, so you launch in weeks, not quarters.</p>
          </div>
          <div className="hero-actions">
            <span className="status glass"><span className="dot" />Available for new projects</span>
            <div className="row">
              <a className="btn btn-ghost btn-lg" href="#solidify">How I work</a>
              <a className="btn btn-cta btn-lg" href="#contact">Start a project</a>
            </div>
          </div>
          <span className="scrollcue">Scroll · watch it take shape</span>
        </section>

        <section id="solidify" className="solidify" aria-label="From idea to product">
          <div className="beat beat-a">
            <span className="eyebrow">01 · Idea</span>
            <h2>Every product starts <em>fluid.</em></h2>
          </div>
          <div className="beat beat-b">
            <span className="eyebrow">04 · Launch</span>
            <h2>It ships <em>solid.</em></h2>
            <p>Precise, fast and built to hold up when the users arrive.</p>
          </div>
        </section>

        <section id="contact" className="contact">
          <h2>Let&apos;s build something people <em>remember.</em></h2>
          <p>Hero prototype. The short contact form comes next.</p>
          <a className="btn btn-cta btn-lg" href="#contact">Start a project</a>
        </section>
      </main>
    </>
  );
}
