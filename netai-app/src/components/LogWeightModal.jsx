import React, { useState } from 'react';
import { 
  Scale, 
  X, 
  Check, 
  Calendar, 
  Target, 
  Plus, 
  Minus,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { validateBiometricSafety } from '../nutritionEngine';

export default function LogWeightModal({ 
  isOpen, 
  onClose, 
  currentWeight = 70, 
  userHeight = 170,
  weightUnit = 'kg', 
  onSaveWeight 
}) {
  const { t } = useTranslation();

  const [weightValue, setWeightValue] = useState(() => {
    return parseFloat(currentWeight) || 70;
  });

  const [dateValue, setDateValue] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [selectedTag, setSelectedTag] = useState('⚖️ Registro habitual');

  if (!isOpen) return null;

  const numWeight = parseFloat(weightValue) || 70;

  // Ethical & Biological Safety Check
  const safetyCheck = validateBiometricSafety(numWeight, userHeight);

  const handleStep = (step) => {
    setWeightValue(prev => {
      const updated = Math.round((parseFloat(prev) + step) * 10) / 10;
      return Math.max(25, Math.min(300, updated));
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!safetyCheck.isValid) return;

    if (numWeight >= 30 && numWeight <= 300) {
      onSaveWeight({
        date: dateValue,
        weight: numWeight,
        tag: selectedTag
      });
      onClose();
    }
  };

  const contextTags = [
    '⚖️ Registro habitual',
    '🌅 En ayunas',
    '💪 Post-actividad',
    '🌙 Al finalizar el día'
  ];

  return (
    <div className="modal-backdrop fade-in" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="log-weight-modal glass-panel" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weight-modal-title"
      >
        {/* Header */}
        <div className="log-weight-header">
          <div className="d-flex align-center gap-3">
            <div className="log-weight-icon-badge">
              <Scale size={22} className="text-emerald" />
            </div>
            <div>
              <h2 id="weight-modal-title" className="log-weight-title">
                Registrar Peso de Referencia
              </h2>
              <p className="log-weight-subtitle">
                Seguimiento neutral para el cálculo de energía y bienestar
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="modal-close-btn"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="log-weight-body">
          {/* Main Weight Stepper Display */}
          <div className="weight-display-card glass-panel">
            <span className="weight-display-label">Medición de Referencia</span>

            <div className="weight-stepper-row">
              <button
                type="button"
                onClick={() => handleStep(-0.5)}
                className="btn-stepper minus"
                aria-label="Restar 0.5 kg"
                title="-0.5 kg"
              >
                <Minus size={20} />
              </button>

              <div className="weight-input-container">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  className="weight-digital-input"
                  required
                  autoFocus
                />
                <span className="weight-digital-unit">{weightUnit}</span>
              </div>

              <button
                type="button"
                onClick={() => handleStep(0.5)}
                className="btn-stepper plus"
                aria-label="Sumar 0.5 kg"
                title="+0.5 kg"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Quick Adjustment Micro-chips */}
            <div className="weight-quick-adjust-chips">
              {[-1, -0.1, +0.1, +1].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleStep(val)}
                  className="btn-micro-chip"
                >
                  {val > 0 ? `+${val}` : val} {weightUnit}
                </button>
              ))}
            </div>
          </div>

          {/* Hard-coded Safety Warning if Underweight IMC */}
          {!safetyCheck.isValid ? (
            <div className="p-3 glass-panel mb-3" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px' }}>
              <div className="d-flex align-start gap-2">
                <ShieldAlert size={20} className="text-red flex-shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    Protección Biológica & Médica
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {safetyCheck.message}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="weight-goal-card glass-panel">
              <div className="d-flex align-center gap-2">
                <Info size={16} className="text-emerald flex-shrink-0" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  El peso oscila naturalmente a diario según descanso, hidratación y ritmo circadiano. Registra solo como guía general de referencia.
                </span>
              </div>
            </div>
          )}

          {/* Date & Context Row */}
          <div className="weight-details-grid">
            <div className="input-group-field">
              <label className="field-label">
                <Calendar size={14} className="text-secondary" />
                Fecha:
              </label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="date-input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="input-group-field">
              <label className="field-label">
                <Sparkles size={14} className="text-emerald" />
                Momento del día:
              </label>
              <div className="tags-row">
                {contextTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`btn-tag-chip ${selectedTag === tag ? 'active' : ''}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="log-weight-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-cancel-weight"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!safetyCheck.isValid}
              className="btn-primary btn-submit-weight"
              style={{ opacity: safetyCheck.isValid ? 1 : 0.5, cursor: safetyCheck.isValid ? 'pointer' : 'not-allowed' }}
            >
              <Check size={18} />
              <span>Guardar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
