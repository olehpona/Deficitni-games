import { useRef, useState } from 'react';

export default function GameConsole({ game, onEject }) {
  const frameWrapRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);

  const gameSrc = game.folder
    ? `/games/${game.folder}/${game.entry || 'index.html'}`
    : game.externalUrl;

  const handleFullscreen = async () => {
    const el = frameWrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  return (
    <section className="console-mode" aria-label={game.title}>
      <header className="console-bar">
        <button type="button" className="console-btn" onClick={onEject}>
          ← Вийняти
        </button>

        <span className="console-title">{game.title}</span>

        <div className="console-actions">
          <button
            type="button"
            className="console-btn"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Перезапуск
          </button>
          <button type="button" className="console-btn" onClick={handleFullscreen}>
            На весь екран
          </button>
        </div>
      </header>

      <div className="console-stage" ref={frameWrapRef}>
        <iframe
          key={`${game.id}-${reloadKey}`}
          src={gameSrc}
          title={game.title}
          className="console-iframe"
          allow="autoplay; fullscreen"
        />
      </div>
    </section>
  );
}
