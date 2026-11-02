import React, { useState } from 'react';
import { 
  Scale, 
  Flame, 
  Calendar, 
  Award, 
  CheckCircle, 
  ChevronRight,
  Sparkles,
  Lock,
  Crown,
  Plus,
  Heart,
  Droplets,
  Activity,
  Smile
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import LogWeightModal from './LogWeightModal';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function ProgressView({ 
  profile = {}, 
  targets = {}, 
  foodLogs = [], 
  plan = 'free', 
  onOpenPremium,
  weightHistory = [],
  onAddWeightEntry,
  wellnessMode = false
}) {
  const { t, formatNumber, units } = useTranslation();
  const [timeRange, setTimeRange] = useState('week'); // 'week' | 'month'
  const [isLogWeightOpen, setIsLogWeightOpen] = useState(false);

  const weightUnit = units === 'metric' ? 'kg' : 'lbs';

  // Compute real average calories and daily distribution from foodLogs
  const dailyCaloriesMap = {};
  foodLogs.forEach(item => {
    const d = item.date || 'Hoy';
    dailyCaloriesMap[d] = (dailyCaloriesMap[d] || 0) + (Number(item.calories) || 0);
  });

  const loggedDays = Object.keys(dailyCaloriesMap);
  const totalLoggedCals = Object.values(dailyCaloriesMap).reduce((a, b) => a + b, 0);
  const avgCals = loggedDays.length > 0 ? Math.round(totalLoggedCals / loggedDays.length) : 0;

  // Ethical Habit Consistency (Instead of restrictive calorie-cutting adherence)
  // Celebrates presence, registering meals, and self-care frequency!
  const targetDaysCount = timeRange === 'week' ? 7 : 30;
  const consistencyRate = Math.min(100, Math.round((loggedDays.length / targetDaysCount) * 100));

  // Effective weight dataset
  const effectiveHistory = weightHistory.length > 0 
    ? weightHistory 
    : (profile.weight ? [{ date: 'Inicio', weight: parseFloat(profile.weight) }] : []);

  const currentWeight = effectiveHistory.length > 0 
    ? effectiveHistory[effectiveHistory.length - 1].weight 
    : (parseFloat(profile.weight) || 70);

  const startWeight = effectiveHistory.length > 0 
    ? effectiveHistory[0].weight 
    : (parseFloat(profile.weight) || 70);

  const weightDelta = (currentWeight - startWeight).toFixed(1);

  return (
    <div className="progress-view-container fade-in">
      {/* Top Header & Range Switcher */}
      <div className="view-header-row">
        <div>
          <span className="section-eyebrow">NetAI Bienestar & Evolución</span>
          <h2 className="view-title">Tu Registro de Bienestar</h2>
          <p className="view-subtitle">
            {wellnessMode 
              ? 'Constancia, hidratación y atención plena a tu alimentación'
              : 'Evolución de hábitos, energía diaria y constancia saludable'}
          </p>
        </div>

        <div className="d-flex align-center gap-2">
          {plan !== 'free' && !wellnessMode && (
            <button 
              type="button" 
              onClick={() => setIsLogWeightOpen(true)}
              className="btn-log-weight-trigger"
            >
              <Plus size={16} />
              <span>Registrar Peso</span>
            </button>
          )}

          <div className="segmented-control">
            <button 
              type="button" 
              className={`seg-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              {t('progress.weekly')}
            </button>
            <button 
              type="button" 
              className={`seg-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              {t('progress.monthly')}
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Clinical Log Weight Modal with safety checks */}
      <LogWeightModal
        isOpen={isLogWeightOpen}
        onClose={() => setIsLogWeightOpen(false)}
        currentWeight={currentWeight}
        userHeight={profile.height || 170}
        weightUnit={weightUnit}
        onSaveWeight={(entry) => {
          if (onAddWeightEntry) {
            onAddWeightEntry({
              date: entry.date,
              weight: entry.weight
            });
          }
        }}
      />

      {/* TOP 3 ETHICAL KPI METRICS */}
      <div className="kpi-grid">
        {/* KPI 1: Weight Variance (Neutral, non-punitive) or Qualitative Plate Habit */}
        {wellnessMode ? (
          <div className="kpi-card glass-panel">
            <div className="kpi-header">
              <span className="kpi-label">Platos Registrados</span>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                <Heart size={18} />
              </div>
            </div>
            <div className="kpi-value-wrap">
              <span className="kpi-value">{foodLogs.length}</span>
              <span className="kpi-unit">platos</span>
            </div>
            <div className="kpi-trend neutral">
              <span>Nutrición intuitiva y consciente</span>
            </div>
          </div>
        ) : plan !== 'free' ? (
          <div className="kpi-card glass-panel">
            <div className="kpi-header">
              <span className="kpi-label">{t('progress.weight')} (Referencia)</span>
              <div className="kpi-icon-wrap green">
                <Scale size={18} />
              </div>
            </div>
            <div className="kpi-value-wrap">
              <span className="kpi-value">{currentWeight}</span>
              <span className="kpi-unit">{weightUnit}</span>
            </div>
            <div className="kpi-trend neutral">
              <span>Variación de registro: {Number(weightDelta) > 0 ? `+${weightDelta}` : weightDelta} {weightUnit}</span>
            </div>
          </div>
        ) : (
          <div className="kpi-card glass-panel locked-kpi-card cursor-pointer" onClick={onOpenPremium}>
            <div className="kpi-header">
              <span className="kpi-label">{t('progress.weight')}</span>
              <div className="kpi-icon-wrap amber">
                <Lock size={16} />
              </div>
            </div>
            <div className="kpi-value-wrap">
              <span className="kpi-value-locked">👑 Premium</span>
            </div>
            <div className="kpi-trend neutral">
              <span>Registro de peso en Basic/Pro</span>
            </div>
          </div>
        )}

        {/* KPI 2: Energy Intake (Hidden in Wellness Mode) or Habit of Nourishment */}
        {!wellnessMode ? (
          <div className="kpi-card glass-panel">
            <div className="kpi-header">
              <span className="kpi-label">Promedio de Energía</span>
              <div className="kpi-icon-wrap amber">
                <Flame size={18} />
              </div>
            </div>
            <div className="kpi-value-wrap">
              <span className="kpi-value">{formatNumber(avgCals)}</span>
              <span className="kpi-unit">kcal/día</span>
            </div>
            <div className="kpi-trend neutral">
              <span>Rango: {targets.targetRange?.label || `${formatNumber(targets.targetCalories)} kcal`}</span>
            </div>
          </div>
        ) : (
          <div className="kpi-card glass-panel">
            <div className="kpi-header">
              <span className="kpi-label">Relación con la Comida</span>
              <div className="kpi-icon-wrap green">
                <Smile size={18} />
              </div>
            </div>
            <div className="kpi-value-wrap">
              <span className="kpi-value">Amable</span>
            </div>
            <div className="kpi-trend neutral">
              <span>Libre de culpa y restricciones</span>
            </div>
          </div>
        )}

        {/* KPI 3: Ethical Habit Consistency (Not caloric restriction!) */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Constancia de Autocuidado</span>
            <div className="kpi-icon-wrap blue">
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value">{consistencyRate}%</span>
          </div>
          <div className="kpi-trend positive">
            <CheckCircle size={15} />
            <span>{loggedDays.length === 0 ? 'Iniciando registro' : `${loggedDays.length} días de registro atento`}</span>
          </div>
        </div>
      </div>

      {/* QUALITATIVE WELLNESS CARD OR HISTORICAL VARIATION CHART */}
      {wellnessMode ? (
        <div className="chart-card glass-panel mt-4 p-4 text-center">
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#8b5cf6' }}>
            <Sparkles size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0' }}>Modo Bienestar: Priorizando lo Cualitativo</h3>
          <p style={{ maxWidth: 520, margin: '0 auto 16px auto', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            En lugar de curvas numéricas de peso o balances calóricos, celebramos la variedad de alimentos frescos, las pausas de hidratación y el acto diario de escuchar a tu cuerpo.
          </p>
          <div className="d-flex justify-center gap-3 flex-wrap">
            <span className="disclaimer-badge">🌱 Enfoque Neutral respecto al Peso</span>
            <span className="disclaimer-badge">✨ Alimentación Atenta</span>
            <span className="disclaimer-badge">🧘 Respeto por tus Señales Naturales</span>
          </div>
        </div>
      ) : (
        <div className="chart-card glass-panel mt-4 position-relative overflow-hidden">
          {plan === 'free' ? (
            <div className="locked-chart-overlay cursor-pointer" onClick={onOpenPremium}>
              <div className="locked-overlay-box">
                <div className="locked-icon-circle">
                  <Crown size={28} className="text-amber" />
                </div>
                <h3 className="locked-box-title">Registro y Curva de Bienestar</h3>
                <p className="locked-box-desc">
                  El registro de referencia histórica y variabilidad de peso está disponible a partir del plan Basic.
                </p>
                <button type="button" onClick={onOpenPremium} className="btn-primary btn-unlock-chart">
                  <Sparkles size={16} />
                  <span>Desbloquear con Basic ($0,69/mes)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Variabilidad Natural del Peso</h3>
                  <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    Registro neutro de referencia corporal ({currentWeight} {weightUnit})
                  </span>
                </div>
                <div className="chart-badge">
                  <span>Referencia de Salud</span>
                </div>
              </div>

              {/* Weight Bars or Clean Empty State */}
              {effectiveHistory.length <= 1 ? (
                <div className="p-4 text-center">
                  <p className="text-secondary mb-2" style={{ fontSize: '0.9rem' }}>
                    Has iniciado tu registro con <strong>{currentWeight} {weightUnit}</strong>. Registra periódicamente si deseas observar las variaciones naturales de tu cuerpo.
                  </p>
                  <button type="button" onClick={() => setIsLogWeightOpen(true)} className="btn-secondary" style={{ display: 'inline-flex' }}>
                    <Plus size={15} />
                    <span>Registrar nueva medición</span>
                  </button>
                </div>
              ) : (
                <div className="bars-chart-container">
                  {effectiveHistory.slice(-7).map((item, idx) => {
                    const weights = effectiveHistory.map(h => h.weight);
                    const minW = Math.min(...weights) - 1;
                    const maxW = Math.max(...weights) + 1;
                    const heightPct = Math.max(25, Math.min(100, ((item.weight - minW) / (maxW - minW || 1)) * 100));

                    return (
                      <div key={idx} className="chart-column">
                        <span className="col-val-tooltip">{item.weight} {weightUnit}</span>
                        <div className="col-bar-wrap">
                          <div 
                            className="col-bar-fill" 
                            style={{ height: `${heightPct}%`, background: 'var(--brand-green)' }}
                          />
                        </div>
                        <span className="col-label">{item.date.slice(-5)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mandatory Medical & Ethical Disclaimer */}
      <div className="mt-4">
        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}
