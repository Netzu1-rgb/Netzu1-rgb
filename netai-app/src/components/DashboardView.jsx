import React from 'react';
import { 
  Droplets, 
  Plus, 
  Camera, 
  Trash2, 
  Sparkles, 
  Heart,
  ShieldCheck,
  CheckCircle2,
  Utensils,
  Sun,
  Coffee,
  Moon,
  Zap
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import DailyMotivationCard from './DailyMotivationCard';

export default function DashboardView({ 
  currentUser,
  profile, 
  targets, 
  foodLogs = [], 
  waterGlasses = 0, 
  onAddWater, 
  onOpenScanner, 
  onRemoveFood,
  onOpenDietPlan,
  photoCredits = 3,
  plan = 'free',
  onOpenPremium,
  wellnessMode = false,
  onToggleWellnessMode
}) {
  const { t, formatNumber } = useTranslation();

  const todayKey = new Date().toISOString().split('T')[0];
  const todayFoodLogs = foodLogs.filter(f => (f.date || todayKey) === todayKey);

  // Aggregate consumed calories and macros for TODAY
  const consumedCalories = todayFoodLogs.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
  const consumedProtein = todayFoodLogs.reduce((acc, curr) => acc + (Number(curr.protein) || 0), 0);
  const consumedCarbs = todayFoodLogs.reduce((acc, curr) => acc + (Number(curr.carbs) || 0), 0);
  const consumedFat = todayFoodLogs.reduce((acc, curr) => acc + (Number(curr.fat) || 0), 0);

  // Reference energy bounds (safe flexible range, NOT a rigid single number)
  const targetCalories = targets.targetCalories || 2000;
  const targetMin = targets.targetRange?.min || Math.round(targetCalories * 0.93);
  const targetMax = targets.targetRange?.max || Math.round(targetCalories * 1.07);
  const targetRangeLabel = targets.targetRange?.label || `${targetMin} – ${targetMax} kcal`;

  const isAboveReference = consumedCalories > targetMax;
  const calPercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));

  // Circular progress calculations for SVG ring (Non-punitive: serene green or royal indigo)
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercent / 100) * circumference;
  const ringColor = isAboveReference ? '#6366f1' : 'var(--brand-green)';

  const displayName = currentUser?.name || profile.name || (profile.gender === 'male' ? 'Campeón' : 'Atleta');

  return (
    <div className="dashboard-content fade-in">
      {/* 1. CONTINUOUS COMPASSIONATE MOTIVATION CARD */}
      <DailyMotivationCard 
        wellnessMode={wellnessMode}
        onExploreInspiration={onOpenDietPlan}
      />

      {/* 2. Header Greeting & Subscription Status */}
      <div className="dash-hero-banner glass-panel">
        <div className="hero-text-col">
          <div className="d-flex align-center gap-2 mb-1">
            <span className="hero-badge">
              {plan === 'pro' ? `👑 ${t('premium.pro')}` : plan === 'basic' ? `⚡ ${t('premium.basic')}` : `🌱 ${t('premium.free')}`}
            </span>
            <span className="hero-credits-pill" onClick={onOpenPremium}>
              {t('scanner.quota', { count: photoCredits })}
            </span>
            {wellnessMode && (
              <span className="wellness-mode-pill">
                🌿 Modo Bienestar
              </span>
            )}
          </div>
          <h2 className="hero-greeting">
            Hola, <span className="text-emerald">{displayName}</span> 👋
          </h2>
          <p className="hero-subtext">
            {wellnessMode ? (
              <span>Priorizando saciedad, variedad y bienestar consciente</span>
            ) : (
              <>
                Rango de Energía Saludable: <strong>{targetRangeLabel}</strong>
                {plan !== 'free' ? (
                  <> | TMB Base: <strong>{targets.bmr} kcal</strong></>
                ) : (
                  <> | TMB: <span className="hero-locked-pill cursor-pointer" onClick={onOpenPremium} title="Tasa Metabólica Basal segura en Basic y Pro">👑 Premium</span></>
                )}
              </>
            )}
          </p>
        </div>

        <div className="hero-actions-col">
          <button type="button" onClick={onOpenScanner} className="btn-primary hero-btn-scan">
            <Camera size={19} />
            <span>{t('nav.scanTitle')}</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN METRICS OR QUALITATIVE WELLNESS MODE VIEW */}
      {wellnessMode ? (
        /* QUALITATIVE WELLNESS MODE DISPLAY (NO NUMBERS, PURE INTUITION) */
        <div className="wellness-qualitative-card glass-panel mt-4">
          <div className="wellness-qualitative-icon">
            <Heart size={28} />
          </div>
          <h3 className="wellness-qualitative-title">Espacio de Bienestar Consciente</h3>
          <p className="wellness-qualitative-desc">
            Los números están en pausa. Disfruta de tus comidas conectando con tu apetito natural, los colores en tu plato y la satisfacción genuina.
          </p>

          <div className="wellness-qualitative-pillars">
            <div className="wellness-pillar-item">
              <Utensils size={20} className="text-emerald" />
              <span>{todayFoodLogs.length} Comidas</span>
              <small className="text-secondary">Registradas hoy</small>
            </div>
            <div className="wellness-pillar-item">
              <Droplets size={20} className="text-cyan" />
              <span>{waterGlasses} Vasos</span>
              <small className="text-secondary">Hidratación</small>
            </div>
            <div className="wellness-pillar-item">
              <Sparkles size={20} className="text-amber" />
              <span>Presencia</span>
              <small className="text-secondary">Autocuidado</small>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW: FLEXIBLE ENERGY BALANCE & SERENE MACROS SPLIT */
        <div className="dash-metrics-grid mt-4">
          {/* Energy Ring Indicator Card */}
          <div className="glass-panel ring-stat-card">
            <div className="stat-card-header">
              <h3>Balance de Energía Diario</h3>
              <span className="pct-badge" style={{ background: isAboveReference ? 'rgba(99, 102, 241, 0.15)' : undefined, color: isAboveReference ? '#6366f1' : undefined }}>
                {calPercent}% del balance
              </span>
            </div>

            <div className="ring-chart-wrapper">
              <svg className="circular-ring-svg" width="190" height="190">
                <circle
                  stroke="var(--border-color)"
                  strokeWidth="13"
                  fill="transparent"
                  r={radius}
                  cx="95"
                  cy="95"
                />
                <circle
                  stroke={ringColor}
                  strokeWidth="13"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  r={radius}
                  cx="95"
                  cy="95"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>

              <div className="ring-center-stat">
                <span className="ring-cals-val">{formatNumber(consumedCalories)}</span>
                <span className="ring-cals-unit">Energía Consumida</span>
                <span className="ring-target-sub">Rango: {targetRangeLabel}</span>
              </div>
            </div>

            <div className="ring-meta-row">
              <div className="ring-meta-item">
                <span className="meta-lbl">{t('meals.consumed')}</span>
                <span className="meta-val text-primary">{formatNumber(consumedCalories)} kcal</span>
              </div>
              <div className="meta-divider" />
              <div className="ring-meta-item">
                <span className="meta-lbl">Rango Saludable</span>
                <span className="meta-val text-emerald">{targetRangeLabel}</span>
              </div>
            </div>

            {/* Non-punitive Positive Reframe Callout if energy is abundant */}
            {isAboveReference && (
              <div className="energy-abundance-callout">
                <Zap size={18} className="text-indigo flex-shrink-0" style={{ color: '#6366f1' }} />
                <span>
                  ⚡ ¡Gran combustible hoy! Tu cuerpo utilizará esta energía para recuperarse, nutrir tus células y mantener tu vitalidad.
                </span>
              </div>
            )}
          </div>

          {/* Macronutrients Progress Card (Flexible & Non-punitive) */}
          <div className="glass-panel macros-stat-card">
            <div className="stat-card-header">
              <h3>Aporte de Nutrientes</h3>
              <span className="pct-badge">Variedad y Balance</span>
            </div>

            <div className="macros-list">
              {/* Protein */}
              <div className="macro-item">
                <div className="macro-item-head">
                  <span className="macro-name-tag text-emerald">{t('macros.protein')}</span>
                  <span className="macro-nums">
                    <strong>{consumedProtein}g</strong> / ~{targets.macros.protein}g
                  </span>
                </div>
                <div className="macro-progress-track">
                  <div 
                    className="macro-progress-fill protein" 
                    style={{ width: `${Math.min(100, (consumedProtein / (targets.macros.protein || 100)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="macro-item">
                <div className="macro-item-head">
                  <span className="macro-name-tag text-carbs">{t('macros.carbs')}</span>
                  <span className="macro-nums">
                    <strong>{consumedCarbs}g</strong> / ~{targets.macros.carbs}g
                  </span>
                </div>
                <div className="macro-progress-track">
                  <div 
                    className="macro-progress-fill carbs" 
                    style={{ width: `${Math.min(100, (consumedCarbs / (targets.macros.carbs || 200)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="macro-item">
                <div className="macro-item-head">
                  <span className="macro-name-tag text-fat">{t('macros.fat')}</span>
                  <span className="macro-nums">
                    <strong>{consumedFat}g</strong> / ~{targets.macros.fat}g
                  </span>
                </div>
                <div className="macro-progress-track">
                  <div 
                    className="macro-progress-fill fat" 
                    style={{ width: `${Math.min(100, (consumedFat / (targets.macros.fat || 60)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hydration tracker */}
            <div className="water-widget-strip mt-3">
              <div className="d-flex align-center gap-2">
                <div className="water-icon-circle">
                  <Droplets size={18} />
                </div>
                <div>
                  <span className="water-label">{t('macros.water')}: {waterGlasses * 250} ml / ~{Math.round(targets.targetWaterLiters * 1000)} ml</span>
                  <span className="water-sub">Cada vaso suma frescura y claridad</span>
                </div>
              </div>
              <button type="button" onClick={onAddWater} className="btn-add-water">
                <Plus size={15} />
                <span>{t('macros.waterAdd')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Meals Logged Today Section */}
      <div className="glass-panel meals-today-section mt-4 mb-4">
        <div className="meals-section-header">
          <div>
            <h3 className="section-title">Registro del Día</h3>
            <p className="section-desc">
              {wellnessMode ? (
                `${todayFoodLogs.length} ${todayFoodLogs.length === 1 ? 'comida registrada' : 'comidas registradas'} hoy`
              ) : (
                `Energía consumida: ${formatNumber(consumedCalories)} kcal • ${todayFoodLogs.length} platos registrados`
              )}
            </p>
          </div>
          <button type="button" onClick={onOpenDietPlan} className="btn-secondary">
            <Plus size={16} />
            <span>{t('meals.addFood')}</span>
          </button>
        </div>

        {todayFoodLogs.length === 0 ? (
          <div className="meals-empty-state">
            <div className="empty-icon-wrap">
              <Camera size={32} />
            </div>
            <h4 className="empty-title">Sin registros aún en este día</h4>
            <p className="empty-desc">
              Cada comida es una oportunidad para conectar con tu alimentación. Escanea tu plato o agrega una comida cuando lo desees.
            </p>
            <button type="button" onClick={onOpenScanner} className="btn-primary mt-2">
              <Camera size={16} />
              <span>{t('nav.scanTitle')}</span>
            </button>
          </div>
        ) : (
          <div className="meals-list-group">
            {todayFoodLogs.map((item) => (
              <div key={item.id} className="meal-card-item">
                <div className="meal-item-left">
                  <img src={item.image} alt={item.name} className="meal-thumbnail" />
                  <div className="meal-meta">
                    <h4 className="meal-name">{item.name}</h4>
                    <span className="meal-timestamp">{item.time}</span>
                  </div>
                </div>

                <div className="meal-item-right">
                  {!wellnessMode && (
                    <>
                      <div className="meal-cal-badge">
                        <span className="cal-val">{item.calories}</span>
                        <span className="cal-lbl">kcal</span>
                      </div>
                      <div className="meal-nutrients-row">
                        <span>P: {item.protein}g</span>
                        <span>C: {item.carbs}g</span>
                        <span>G: {item.fat}g</span>
                      </div>
                    </>
                  )}
                  {wellnessMode && (
                    <span className="badge-wellness-plate">
                      ✨ Plato Nutritivo
                    </span>
                  )}
                  <button 
                    type="button" 
                    onClick={() => onRemoveFood(item.id)} 
                    className="btn-delete-meal"
                    aria-label={t('meals.delete')}
                    title={t('meals.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
