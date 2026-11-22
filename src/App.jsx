import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import catalog from '../games.json';
import CartridgeCard from './components/CartridgeCard.jsx';
import GameConsole from './components/GameConsole.jsx';

function getGameIdFromHash() {
  const match = window.location.hash.match(/^#play=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const publishedGames = useMemo(
    () => (catalog.games || []).filter((g) => g.published !== false),
    []
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeGameId, setActiveGameId] = useState(() => {
    const hashId = getGameIdFromHash();
    return publishedGames.some((g) => g.id === hashId) ? hashId : null;
  });
  const wheelLockRef = useRef(0);

  useEffect(() => {
    const onHashChange = () => {
      const hashId = getGameIdFromHash();
      if (hashId) {
        const idx = publishedGames.findIndex((g) => g.id === hashId);
        if (idx !== -1) {
          setSelectedIndex(idx);
          setActiveGameId(hashId);
        }
      } else {
        setActiveGameId(null);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [publishedGames]);

  const total = publishedGames.length;
  const selectedGame = publishedGames[selectedIndex] || null;
  const activeGame = publishedGames.find((g) => g.id === activeGameId) || null;

  const step = useCallback(
    (dir) => {
      if (total <= 1) return;
      setSelectedIndex((i) => Math.max(0, Math.min(total - 1, i + dir)));
    },
    [total]
  );

  const handlePlay = useCallback((game) => {
    if (!game || (!game.folder && !game.externalUrl)) return;
    setActiveGameId(game.id);
    window.location.hash = `play=${encodeURIComponent(game.id)}`;
  }, []);

  useEffect(() => {
    if (activeGame) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Enter' && selectedGame) handlePlay(selectedGame);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeGame, step, selectedGame, handlePlay]);

  const handleWheel = (e) => {
    if (total <= 1) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 420) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 25) return;
    wheelLockRef.current = now;
    step(delta > 0 ? 1 : -1);
  };

  const handleEject = () => {
    setActiveGameId(null);
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  if (activeGame) {
    return (
      <div className="hall is-playing">
        <GameConsole game={activeGame} onEject={handleEject} />
      </div>
    );
  }

  return (
    <div className="hall" onWheel={handleWheel}>
      {/* Aurora-style blurred backdrop of selected game */}
      {selectedGame?.previewImage && (
        <div
          key={selectedGame.id}
          className="aurora-backdrop"
          style={{ backgroundImage: `url(${selectedGame.previewImage})` }}
          aria-hidden="true"
        />
      )}

      <header className="hall-top">
        <h1 className="hall-title">{catalog.hallName || 'Дефіцитні ігри'}</h1>
        {total > 0 && (
          <span className="hall-counter">
            {selectedIndex + 1} / {total}
          </span>
        )}
      </header>

      <main className="hall-center">
        {total === 0 ? (
          <p className="hall-empty">У games.json поки немає ігор.</p>
        ) : (
          <>
            <div className="coverflow-wrap">
              <button
                type="button"
                className="coverflow-nav"
                onClick={() => step(-1)}
                disabled={selectedIndex === 0}
                aria-label="Попередній катридж"
              >
                ‹
              </button>

              <div className="coverflow-stage">
                {publishedGames.map((game, index) => (
                  <CartridgeCard
                    key={game.id}
                    game={game}
                    isActive={index === selectedIndex}
                    offset={index - selectedIndex}
                    onSelect={() => setSelectedIndex(index)}
                    onPlay={handlePlay}
                  />
                ))}
              </div>

              <button
                type="button"
                className="coverflow-nav"
                onClick={() => step(1)}
                disabled={selectedIndex === total - 1}
                aria-label="Наступний катридж"
              >
                ›
              </button>
            </div>

            {selectedGame && (
              <section className="aurora-info" aria-label="Опис гри">
                <div className="aurora-info-main">
                  <div className="aurora-info-head">
                    <h2>{selectedGame.title}</h2>
                    {selectedGame.genre && (
                      <span className="aurora-genre">{selectedGame.genre}</span>
                    )}
                  </div>
                  <p>{selectedGame.description}</p>
                </div>

                <button
                  type="button"
                  className="play-btn"
                  style={{ '--accent': selectedGame.accentColor || '#d93829' }}
                  disabled={!selectedGame.folder && !selectedGame.externalUrl}
                  onClick={() => handlePlay(selectedGame)}
                >
                  {selectedGame.folder || selectedGame.externalUrl ? 'Грати' : 'Скоро'}
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
