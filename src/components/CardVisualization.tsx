import { useEffect, useState } from 'react';

interface Tilt {
  x: number;
  y: number;
}

const MAX_TILT_DEGREES = 8;

function limitTilt(x: number, y: number): Tilt {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= MAX_TILT_DEGREES) return { x, y };

  const scale = MAX_TILT_DEGREES / magnitude;
  return { x: x * scale, y: y * scale };
}

export function CardVisualization() {
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    function updateTiltAvailability() {
      const hasTouchInput = navigator.maxTouchPoints > 0 || coarsePointer.matches;
      setTiltEnabled(!reducedMotion.matches && !hasTouchInput);
      setTilt({ x: 0, y: 0 });
    }

    updateTiltAvailability();
    reducedMotion.addEventListener('change', updateTiltAvailability);
    coarsePointer.addEventListener('change', updateTiltAvailability);

    return () => {
      reducedMotion.removeEventListener('change', updateTiltAvailability);
      coarsePointer.removeEventListener('change', updateTiltAvailability);
    };
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!tiltEnabled || event.pointerType === 'touch') return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    setTilt(limitTilt(x * MAX_TILT_DEGREES, -y * MAX_TILT_DEGREES));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!tiltEnabled) return;

    const step = event.shiftKey ? 4 : 2;
    const adjustments: Record<string, Tilt> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    };
    const adjustment = adjustments[event.key];
    if (!adjustment) return;

    event.preventDefault();
    setTilt(current => limitTilt(current.x + adjustment.x, current.y + adjustment.y));
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div className="card-visualization">
      <div
        className={`visual-card${tiltEnabled ? ' visual-card--tiltable' : ''}`}
        role="group"
        aria-label="Decorative credit card illustration"
        aria-describedby="visual-card-instructions"
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onKeyDown={handleKeyDown}
        onBlur={resetTilt}
        style={{
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        }}
      >
        <div className="visual-card__topline">
          <span className="visual-card__mark" aria-hidden="true">S</span>
          <span className="visual-card__label">EDUCATIONAL VISUAL</span>
        </div>
        <div className="visual-card__chip" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="visual-card__bottomline">
          <span>NOT A PAYMENT CARD</span>
          <span className="visual-card__dots" aria-hidden="true">••••</span>
        </div>
      </div>
      <p id="visual-card-instructions" className="visual-card__caption">
        Decorative illustration only. No account or personal information is shown.
        {!tiltEnabled ? null : ' Use your pointer or arrow keys to tilt.'}
      </p>
    </div>
  );
}
