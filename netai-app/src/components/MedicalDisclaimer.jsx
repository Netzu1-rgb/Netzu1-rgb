import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { MEDICAL_DISCLAIMER_TEXT } from '../nutritionEngine';

export default function MedicalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="medical-disclaimer-compact glass-panel">
        <ShieldCheck size={16} className="text-emerald flex-shrink-0" />
        <span className="disclaimer-text">
          Información educativa e inspiradora. No sustituye la consulta o indicación de un profesional de la salud matriculado.
        </span>
      </div>
    );
  }

  return (
    <aside 
      className="medical-disclaimer-card glass-panel" 
      role="note" 
      aria-label="Aviso médico y ético"
    >
      <div className="d-flex align-start gap-3">
        <div className="disclaimer-icon-wrap">
          <ShieldCheck size={20} className="text-emerald" />
        </div>
        <div className="disclaimer-content">
          <h4 className="disclaimer-title">Compromiso con tu Salud & Aviso Médico</h4>
          <p className="disclaimer-paragraph">
            {MEDICAL_DISCLAIMER_TEXT}
          </p>
          <div className="disclaimer-badges">
            <span className="disclaimer-badge">🌱 Enfoque Neutral respecto al Peso</span>
            <span className="disclaimer-badge">🛡️ Espacio Seguro Anti-TCA</span>
            <span className="disclaimer-badge">🩺 Guía Educativa</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
