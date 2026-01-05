'use client';

import { useState } from 'react';

interface DemoButtonProps {
  onClick: () => void;
  remaining?: number;
}

export function DemoButton({ onClick, remaining = 3 }: DemoButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      className="demo-button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="demo-icon">✨</span>
      <span className="demo-text">Попробовать бесплатно</span>
      {remaining > 0 && (
        <span className="demo-badge">{remaining} {getDemoWord(remaining)}</span>
      )}

      <style jsx>{`
        .demo-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 18px 32px;
          background: linear-gradient(135deg, #238636 0%, #2ea043 50%, #3fb950 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(35, 134, 54, 0.5);
          position: relative;
          overflow: hidden;
        }

        .demo-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s ease;
        }

        .demo-button:hover::before {
          left: 100%;
        }

        .demo-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(35, 134, 54, 0.5);
        }

        .demo-button:active {
          transform: translateY(0);
        }

        .demo-icon {
          font-size: 24px;
          animation: ${isHovered ? 'sparkle 0.6s ease-in-out' : 'none'};
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-10deg); }
          50% { transform: scale(1.3) rotate(10deg); }
          75% { transform: scale(1.2) rotate(-5deg); }
        }

        .demo-text {
          position: relative;
          z-index: 1;
        }

        .demo-badge {
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </button>
  );
}

function getDemoWord(count: number): string {
  if (count === 1) return 'анализ';
  if (count >= 2 && count <= 4) return 'анализа';
  return 'анализов';
}
