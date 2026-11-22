export default function CartridgeCard({ game, isActive, offset, onSelect, onPlay }) {
  const shell = game.shellColor || '#242528';
  const accent = game.accentColor || '#d93829';
  const side = offset === 0 ? 0 : offset < 0 ? -1 : 1;
  const absOffset = Math.abs(offset);

  return (
    <button
      type="button"
      className={`cart ${isActive ? 'is-active' : ''}`}
      data-side={side}
      style={{
        '--shell': shell,
        '--accent': accent,
        '--offset': offset,
        '--abs': absOffset,
        zIndex: 20 - absOffset,
      }}
      onClick={() => (isActive ? onPlay(game) : onSelect(game))}
      aria-label={game.title}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className="cart-head">
        <div className="cart-grip" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {game.serial && <span className="cart-code">{game.serial}</span>}
      </div>

      <div className="cart-body">
        <div className="cart-notch cart-notch-l" aria-hidden="true" />
        <div className="cart-sticker">
          <div className="cart-cover">
            {game.previewImage ? (
              <img src={game.previewImage} alt={game.title} draggable="false" />
            ) : (
              <div className="cart-cover-empty">{game.shortTitle || game.title}</div>
            )}
          </div>
          <div className="cart-spine">
            <span className="cart-name">{game.shortTitle || game.title}</span>
          </div>
        </div>
        <div className="cart-notch cart-notch-r" aria-hidden="true" />
      </div>

      <div className="cart-foot" aria-hidden="true">
        <div className="cart-lip">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </button>
  );
}
