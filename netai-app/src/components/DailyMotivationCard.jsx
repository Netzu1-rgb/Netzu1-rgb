import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, RefreshCw, Sun, ChevronRight, Zap } from 'lucide-react';
import { MOTIVATIONAL_SPARKS } from '../nutritionEngine';

export default function DailyMotivationCard({ wellnessMode = false, onExploreInspiration }) {
  const [sparkIndex, setSparkIndex] = useState(() => {
    return Math.floor(Math.random() * MOTIVATIONAL_SPARKS.daily.length);
  });
  const [animating, setAnimating] = useState(false);

  const spark = MOTIVATIONAL_SPARKS.daily[sparkIndex] || MOTIVATIONAL_SPARKS.daily[0];

  const handleNextSpark = () => {
    setAnimating(true);
    setTimeout(() => {
      setSparkIndex(prev => (prev + 1) % MOTIVATIONAL_SPARKS.daily.length);
      setAnimating(false);
    }, 200);
  };

  return (
    <div className="daily-motivation-banner glass-panel">
      <div className="motivation-banner-glow" />
      
      <div className="motivation-banner-content">
        <div className="motivation-header">
          <div className="d-flex align-center gap-2">
            <div className="motivation-icon-pill">
              <Sparkles size={16} className="text-emerald animate-pulse" />
              <span>Impulso Positivo de Hoy</span>
            </div>
            {wellnessMode && (
              <span className="wellness-mode-pill">
                🌿 Modo Bienestar Activo
              </span>
            )}
          </div>

          <button 
            type="button" 
            onClick={handleNextSpark} 
            className="btn-refresh-spark"
            title="Ver otra frase motivacional"
            aria-label="Ver otro mensaje de motivación"
          >
            <RefreshCw size={14} className={animating ? 'spin-anim' : ''} />
            <span>Inspirar</span>
          </button>
        </div>

        <div className={`motivation-quote-row ${animating ? 'fade-out' : 'fade-in'}`}>
          <p className="motivation-quote-text">
            “{spark.text}”
          </p>
          <span className="motivation-author">— {spark.author}</span>
        </div>

        <div className="motivation-footer-actions">
          <span className="motivation-sub-hint">
            💚 Nutrirte es un proceso diario de aprendizaje, no una meta rígida.
          </span>
          {onExploreInspiration && (
            <button 
              type="button" 
              onClick={onExploreInspiration} 
              className="btn-motivation-link"
            >
              <span>Ver recetas reconfortantes</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
