import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Scale, 
  Flame, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Target,
  Zap,
  Droplets,
  Egg,
  Wheat,
  Avocado,
  Check,
  TrendingDown,
  TrendingUp,
  Dumbbell,
  HeartPulse,
  Info,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { 
  ACTIVITY_MULTIPLIERS, 
  GOAL_ADJUSTMENTS, 
  PROTEIN_OPTIONS, 
  CARB_OPTIONS, 
  FAT_OPTIONS,
  calculateNutritionTargets,
  validateBiometricSafety,
  MEDICAL_DISCLAIMER_TEXT
} from '../nutritionEngine';
import CustomDropdown from './CustomDropdown';

// Metadata for weight-neutral goals
const GOAL_ICONS = {
  vitality: { icon: HeartPulse, color: '#10b981', badge: 'Equilibrio & Salud' },
  active_energy: { icon: Zap, color: '#06b6d4', badge: 'Energía Activa' },
  strength_recov: { icon: Dumbbell, color: '#3b82f6', badge: 'Fuerza & Reparación' },
  nourish_boost: { icon: Sparkles, color: '#8b5cf6', badge: 'Nutrición Plena' }
};

export default function OnboardingModal({ isOpen, onComplete, initialData, onClose }) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState(initialData || {
    name: '',
    gender: 'male',
    age: 26,
    weight: 70,
    height: 175,
    targetWeight: 68,
    activityLevel: 'moderate',
    goal: 'vitality',
    preferredProteins: ['pollo', 'huevos', 'pescado'],
    preferredCarbs: ['avena', 'arroz', 'batata'],
    preferredFats: ['aguacate', 'oliva', 'frutos_secos'],
    targetWaterCustom: 3.0,
    allergies: []
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData, isOpen]);

  // Live real-time calculations based on current formData
  const liveTargets = useMemo(() => {
    return calculateNutritionTargets(formData);
  }, [formData]);

  // Safety check for weight & height
  const safetyCheck = useMemo(() => {
    return validateBiometricSafety(formData.weight, formData.height);
  }, [formData.weight, formData.height]);

  if (!isOpen) return null;

  const toggleSelection = (key, itemId) => {
    setFormData(prev => {
      const currentList = prev[key] || [];
      const updated = currentList.includes(itemId)
        ? currentList.filter(id => id !== itemId)
        : [...currentList, itemId];
      return { ...prev, [key]: updated };
    });
  };

  const handleNext = () => {
    if (step === 2 && !safetyCheck.isValid) return;

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAdjustWater = (delta) => {
    setFormData(prev => {
      const cur = parseFloat(prev.targetWaterCustom || 3.0);
      const next = Math.max(1.5, Math.min(6.0, Math.round((cur + delta) * 10) / 10));
      return { ...prev, targetWaterCustom: next };
    });
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal glass-panel fade-in">
        {/* Header Progress & Branding */}
        <div className="onboarding-modal-header">
          <div className="header-top-row">
            <div className="brand-logo-badge">
              <div className="badge-icon-wrap">
                <Zap size={16} className="text-emerald" />
              </div>
              <div>
                <span className="brand-name">NetAI</span>
                <span className="brand-dot">•</span>
                <span className="brand-module">Constructor Clínico de Dieta</span>
              </div>
            </div>

            <div className="d-flex align-center gap-2">
              <span className="step-counter-pill">Paso {step} de {totalSteps}</span>
              {onClose && (
                <button type="button" onClick={onClose} className="btn-close-onboarding" aria-label="Cerrar">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Segmented Step Progress Bar */}
          <div className="onboarding-progress-track">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div 
                key={idx} 
                className={`progress-seg ${idx <= step ? 'completed' : ''} ${idx === step ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="onboarding-modal-body">
          {/* PASO 1: ENFOQUE DE BIENESTAR */}
          {step === 1 && (
            <div className="onboarding-step-view fade-in">
              <div className="step-banner-intro">
                <div className="step-icon-circle emerald">
                  <Target size={26} />
                </div>
                <div>
                  <h2 className="step-main-title">¿Cuál es tu enfoque de bienestar primordial?</h2>
                  <p className="step-subtitle-desc">
                    Estimaremos tu balance de energía saludable adaptado a tu estilo de vida para nutrir tu vitalidad diaria.
                  </p>
                </div>
              </div>

              <div className="goals-cards-stack mt-4">
                {Object.entries(GOAL_ADJUSTMENTS).map(([key, item]) => {
                  const isSelected = formData.goal === key;
                  const meta = GOAL_ICONS[key] || { icon: Target, color: '#10b981', badge: 'Objetivo' };
                  const IconComp = meta.icon;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, goal: key })}
                      className={`goal-card-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="goal-card-left">
                        <div className="goal-icon-wrap" style={{ color: meta.color, background: `${meta.color}18` }}>
                          <IconComp size={22} />
                        </div>
                        <div className="goal-texts">
                          <div className="d-flex align-center gap-2 mb-1">
                            <span className="goal-title">{item.label}</span>
                            <span className="goal-badge-pill" style={{ color: meta.color, borderColor: `${meta.color}35`, background: `${meta.color}10` }}>
                              {meta.badge}
                            </span>
                          </div>
                          <span className="goal-desc">{item.desc}</span>
                        </div>
                      </div>

                      <div className={`goal-radio-indicator ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 2: DATOS BIOMÉTRICOS (Mifflin-St Jeor) */}
          {step === 2 && (
            <div className="onboarding-step-view fade-in">
              <div className="step-banner-intro">
                <div className="step-icon-circle cyan">
                  <User size={26} />
                </div>
                <div>
                  <h2 className="step-main-title">Tus métricas biométricas basales</h2>
                  <p className="step-subtitle-desc">
                    Utilizamos la ecuación científica de <strong>Mifflin-St Jeor</strong> para estimar tu Tasa Metabólica Basal (BMR).
                  </p>
                </div>
              </div>

              <div className="biometrics-form-grid mt-4">
                {/* Sexo Biológico */}
                <div className="bio-field-card full-width">
                  <label className="bio-field-label">Sexo biológico (requerido para fórmula metabólica)</label>
                  <div className="gender-segmented-control">
                    <button
                      type="button"
                      className={`gender-choice-btn ${formData.gender === 'male' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                    >
                      <span className="gender-symbol">♂</span>
                      <span>Hombre</span>
                    </button>
                    <button
                      type="button"
                      className={`gender-choice-btn ${formData.gender === 'female' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, gender: 'female' })}
                    >
                      <span className="gender-symbol">♀</span>
                      <span>Mujer</span>
                    </button>
                  </div>
                </div>

                {/* Edad */}
                <div className="bio-field-card">
                  <label className="bio-field-label">Edad</label>
                  <div className="bio-input-wrapper">
                    <input
                      type="number"
                      min="14"
                      max="99"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="bio-input"
                    />
                    <span className="bio-unit">años</span>
                  </div>
                </div>

                {/* Altura */}
                <div className="bio-field-card">
                  <label className="bio-field-label">Altura</label>
                  <div className="bio-input-wrapper">
                    <input
                      type="number"
                      min="100"
                      max="230"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="bio-input"
                    />
                    <span className="bio-unit">cm</span>
                  </div>
                </div>

                {/* Peso Actual */}
                <div className="bio-field-card full-width">
                  <label className="bio-field-label">Peso actual de referencia</label>
                  <div className="bio-input-wrapper">
                    <input
                      type="number"
                      step="0.5"
                      min="35"
                      max="250"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="bio-input"
                    />
                    <span className="bio-unit">kg</span>
                  </div>
                </div>

                {/* Nivel de Actividad */}
                <div className="bio-field-card full-width">
                  <label className="bio-field-label">Nivel de Actividad Diaria</label>
                  <CustomDropdown
                    value={formData.activityLevel}
                    onChange={(level) => setFormData(prev => ({ ...prev, activityLevel: level }))}
                    width="full"
                    options={Object.entries(ACTIVITY_MULTIPLIERS).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                      desc: v.desc,
                      badge: `x${v.factor}`,
                      icon: Activity,
                      color: k === 'sedentary' ? '#94A3B8' : k === 'light' ? '#38BDF8' : k === 'moderate' ? '#22C55E' : k === 'very_active' ? '#F59E0B' : '#EC4899'
                    }))}
                    ariaLabel="Nivel de Actividad Diaria"
                  />
                </div>
              </div>

              {/* Safety validation alert if IMC is underweight */}
              {!safetyCheck.isValid && (
                <div className="p-3 glass-panel mt-3" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                    🛡️ {safetyCheck.message}
                  </p>
                </div>
              )}

              {/* Real-time Diagnostics Live Preview Box */}
              <div className="clinical-live-preview-box mt-3">
                <div className="preview-stat-item">
                  <span className="prev-label">TMB Basal Vital</span>
                  <strong className="prev-val text-emerald">{liveTargets.bmr} kcal</strong>
                </div>
                <div className="prev-divider" />
                <div className="preview-stat-item">
                  <span className="prev-label">Gasto TDEE</span>
                  <strong className="prev-val text-cyan">{liveTargets.tdee} kcal</strong>
                </div>
                <div className="prev-divider" />
                <div className="preview-stat-item">
                  <span className="prev-label">Rango Seguro</span>
                  <strong className="prev-val">{liveTargets.bmiCategory}</strong>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: PROTEÍNAS PREFERIDAS */}
          {step === 3 && (
            <div className="onboarding-step-view fade-in">
              <div className="step-banner-intro">
                <div className="step-icon-circle emerald">
                  <Flame size={26} />
                </div>
                <div>
                  <h2 className="step-main-title">¿Qué fuentes de proteína preferís?</h2>
                  <p className="step-subtitle-desc">
                    Seleccioná todas las que te gusten para estructurar las recetas de tu plan nutricional.
                  </p>
                </div>
              </div>

              <div className="food-selection-grid mt-4">
                {PROTEIN_OPTIONS.map((item) => {
                  const isChecked = (formData.preferredProteins || []).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelection('preferredProteins', item.id)}
                      className={`food-choice-card ${isChecked ? 'selected' : ''}`}
                    >
                      <div className="choice-header">
                        <span className="food-name">{item.label}</span>
                        <div className={`choice-checkbox ${isChecked ? 'checked' : ''}`}>
                          {isChecked && <Check size={14} />}
                        </div>
                      </div>
                      <span className="food-desc">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 4: CARBOHIDRATOS PREFERIDOS */}
          {step === 4 && (
            <div className="onboarding-step-view fade-in">
              <div className="step-banner-intro">
                <div className="step-icon-circle cyan">
                  <Wheat size={26} />
                </div>
                <div>
                  <h2 className="step-main-title">¿Qué carbohidratos complejos preferís?</h2>
                  <p className="step-subtitle-desc">
                    Tu fuente primordial de glucógeno y energía sostenida para el día y los entrenamientos.
                  </p>
                </div>
              </div>

              <div className="food-selection-grid mt-4">
                {CARB_OPTIONS.map((item) => {
                  const isChecked = (formData.preferredCarbs || []).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelection('preferredCarbs', item.id)}
                      className={`food-choice-card ${isChecked ? 'selected' : ''}`}
                    >
                      <div className="choice-header">
                        <span className="food-name">{item.label}</span>
                        <div className={`choice-checkbox ${isChecked ? 'checked' : ''}`}>
                          {isChecked && <Check size={14} />}
                        </div>
                      </div>
                      <span className="food-desc">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 5: GRASAS SALUDABLES PREFERIDAS */}
          {step === 5 && (
            <div className="onboarding-step-view fade-in">
              <div className="step-banner-intro">
                <div className="step-icon-circle amber">
                  <Sparkles size={26} />
                </div>
                <div>
                  <h2 className="step-main-title">¿Qué grasas saludables preferís?</h2>
                  <p className="step-subtitle-desc">
                    Cruciales para el perfil hormonal, saciedad prolongada y absorción de micronutrientes.
                  </p>
                </div>
              </div>

              <div className="food-selection-grid mt-4">
                {FAT_OPTIONS.map((item) => {
                  const isChecked = (formData.preferredFats || []).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelection('preferredFats', item.id)}
                      className={`food-choice-card ${isChecked ? 'selected' : ''}`}
                    >
                      <div className="choice-header">
                        <span className="food-name">{item.label}</span>
                        <div className={`choice-checkbox ${isChecked ? 'checked' : ''}`}>
                          {isChecked && <Check size={14} />}
                        </div>
                      </div>
                      <span className="food-desc">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 6: LITROS DE AGUA & PLAN FINAL */}
          {step === 6 && (
            <div className="onboarding-step-view fade-in">
              <div className="step-banner-intro">
                <div className="step-icon-circle cyan">
                  <Droplets size={26} />
                </div>
                <div>
                  <h2 className="step-main-title">Objetivo diario de hidratación</h2>
                  <p className="step-subtitle-desc">
                    El agua es esencial para el metabolismo lipídico y la absorción de nutrientes.
                  </p>
                </div>
              </div>

              {/* Water Selector Widget Card */}
              <div className="water-config-card mt-4">
                <div className="water-display-center">
                  <div className="water-droplet-glow">
                    <Droplets size={38} className="text-cyan" />
                  </div>
                  
                  <div className="d-flex align-center justify-center gap-3 my-2">
                    <button 
                      type="button" 
                      onClick={() => handleAdjustWater(-0.25)}
                      className="btn-water-step"
                      aria-label="Disminuir agua"
                    >
                      <Minus size={18} />
                    </button>
                    
                    <span className="water-large-value">
                      {formData.targetWaterCustom || 3.0} <span className="unit">Litros/día</span>
                    </span>

                    <button 
                      type="button" 
                      onClick={() => handleAdjustWater(0.25)}
                      className="btn-water-step"
                      aria-label="Aumentar agua"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <span className="water-glasses-sub">
                    Aproximadamente <strong>{Math.round((formData.targetWaterCustom || 3.0) * 4)} vasos</strong> de 250ml al día
                  </span>
                </div>

                <div className="water-presets-pills mt-3">
                  {[2.0, 2.5, 3.0, 3.5, 4.0].map((liters) => (
                    <button
                      key={liters}
                      type="button"
                      className={`water-preset-chip ${formData.targetWaterCustom === liters ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, targetWaterCustom: liters })}
                    >
                      {liters} L
                    </button>
                  ))}
                </div>
              </div>

              {/* Comprehensive Clinical Diagnostic Summary */}
              <div className="clinical-final-summary-card mt-4">
                <div className="summary-card-head">
                  <div className="d-flex align-center gap-2">
                    <Sparkles size={20} className="text-emerald" />
                    <h3 className="summary-title">Tu Resumen de Bienestar NetAI</h3>
                  </div>
                  <span className="summary-badge">Enfoque Seguro</span>
                </div>

                <div className="summary-metrics-row mt-3">
                  <div className="metric-cell calories">
                    <span className="cell-lbl">Rango de Energía</span>
                    <strong className="cell-val">{liveTargets.targetRange?.label || `${liveTargets.targetCalories} kcal`}</strong>
                  </div>
                  <div className="metric-cell protein">
                    <span className="cell-lbl">Proteína Diaria</span>
                    <strong className="cell-val">~{liveTargets.macros.protein}g</strong>
                  </div>
                  <div className="metric-cell carbs">
                    <span className="cell-lbl">Carbohidratos</span>
                    <strong className="cell-val">~{liveTargets.macros.carbs}g</strong>
                  </div>
                  <div className="metric-cell fat">
                    <span className="cell-lbl">Grasas Buenas</span>
                    <strong className="cell-val">~{liveTargets.macros.fat}g</strong>
                  </div>
                </div>

                <p className="summary-caption mt-3">
                  Todo listo. Al continuar, NetAI preparará tu catálogo de inspiración culinaria y tu panel de bienestar diario.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="onboarding-modal-footer">
          {step > 1 ? (
            <button type="button" onClick={handlePrev} className="btn-secondary onboarding-back-btn">
              <ArrowLeft size={18} />
              <span>Atrás</span>
            </button>
          ) : (
            <div />
          )}

          <button 
            type="button" 
            onClick={handleNext} 
            disabled={step === 2 && !safetyCheck.isValid}
            className="btn-primary onboarding-next-btn"
            style={{ opacity: (step === 2 && !safetyCheck.isValid) ? 0.5 : 1 }}
          >
            <span>{step === totalSteps ? 'Finalizar y Explorar Inspiración' : 'Continuar'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
