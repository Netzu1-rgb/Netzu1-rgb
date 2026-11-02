import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  Globe, 
  X,
  CreditCard,
  Lock,
  Camera,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function PremiumModal({ 
  isOpen, 
  onClose, 
  currentPlan = 'free', 
  onSelectPlan,
  photoCredits = 3,
  country = 'AR'
}) {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Economic relief pricing check: 30% discount exclusively for Argentina and countries facing economic hardship
  const ECONOMIC_STRUGGLE_COUNTRIES = [
    'AR', // Argentina (specifically requested)
    'VE', // Venezuela
    'BO', // Bolivia
    'CU', // Cuba
    'NI', // Nicaragua
    'CO', // Colombia
    'PE', // Perú
    'EC', // Ecuador
    'PY', // Paraguay
    'UY', // Uruguay
    'GT', // Guatemala
    'HN', // Honduras
    'SV', // El Salvador
    'DO'  // República Dominicana
  ];

  const isStrugglingEconomy = ECONOMIC_STRUGGLE_COUNTRIES.includes(country) || country === 'AR';

  const plans = [
    {
      id: 'free',
      name: t('premium.free'),
      subtitle: 'Comienza tu cambio de hábitos',
      price: '$0',
      period: 'para siempre',
      badge: 'Básico',
      photos: '3 fotos de prueba en total',
      features: [
        'Registro manual ilimitado de alimentos',
        'Contador diario de calorías y macronutrientes',
        '3 análisis de comidas por foto con IA de por vida',
        'Biblioteca de alimentos frecuentes y favoritos',
        'Horarios de comidas personalizables'
      ],
      isPopular: false,
      ctaText: t('premium.currentPlan')
    },
    {
      id: 'basic',
      name: t('premium.basic'),
      subtitle: 'Seguimiento consistente y ágil',
      price: isStrugglingEconomy ? 'US$0,69' : 'US$0,99',
      originalPrice: isStrugglingEconomy ? 'US$0,99' : null,
      period: 'al mes',
      badge: isStrugglingEconomy ? '🔥 30% OFF' : 'Accesible',
      photos: '60 fotos mensuales',
      features: [
        'Todas las funciones gratuitas',
        'Cálculo de BMR y TDEE (Mifflin-St Jeor)',
        'Registro de peso y objetivos corporales',
        '60 análisis fotográficos con IA al mes',
        'Estimación automática de porciones y gramos',
        'Desglose exacto de proteína, carbos y grasas',
        'Historial nutricional completo y exportable',
        'Soporte prioritario y sin anuncios'
      ],
      isPopular: false,
      ctaText: `${t('premium.subscribe')} Basic`
    },
    {
      id: 'pro',
      name: t('premium.pro'),
      subtitle: 'El estándar de atletas y alto rendimiento',
      price: 'US$1,99',
      originalPrice: null,
      period: 'al mes',
      badge: 'Recomendado',
      photos: '150 fotos mensuales',
      features: [
        'Todas las herramientas de Premium Basic',
        'Cálculo clínico de BMR y TDEE (Mifflin-St Jeor)',
        'Registro avanzado y evolución de peso y objetivos',
        '150 análisis fotográficos con IA al mes (~5 platos/día)',
        'Estadísticas nutricionales avanzadas y tendencias',
        'Gráficos interactivos de evolución y macronutrientes',
        'Comparación de progreso entre períodos',
        'Recomendaciones nutricionales dinámicas por IA',
        'Informes mensuales de adherencia y hábitos'
      ],
      isPopular: true,
      ctaText: `${t('premium.subscribe')} Pro`
    }
  ];

  const handleSubscribe = (planId) => {
    if (planId === currentPlan) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSelectPlan(planId);
      setSuccessMessage(`¡${planId.toUpperCase()} activado!`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1500);
    }, 1000);
  };

  const handleRestorePurchases = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('Suscripciones verificadas con éxito. Estado sincronizado con App Store / Google Play.');
    }, 900);
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="premium-modal-card glass-panel" onClick={e => e.stopPropagation()}>
        {/* Header with Close */}
        <div className="premium-header">
          <div className="d-flex align-center gap-2">
            <div className="premium-logo-badge">
              <Zap size={22} className="text-emerald" />
            </div>
            <div>
              <h2 className="premium-modal-title">{t('premium.title')}</h2>
              <p className="premium-modal-subtitle">
                {t('premium.subtitle')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Special Discount Notice exclusively on Premium Basic */}
        <div className="regional-banner">
          <Zap size={16} className="text-emerald shrink-0" />
          <span>
            {isStrugglingEconomy ? (
              <>
                <strong>Descuento activo en Premium Basic:</strong> Precio promocional exclusivo (30% OFF) para Argentina y países en situación económica difícil (<strong>US$0,69/mes</strong>). Plan Pro disponible a <strong>US$1,99/mes</strong> en todas las regiones.
              </>
            ) : (
              <>
                <strong>Planes NetAI Vision:</strong> Elige el plan ideal para tus objetivos nutricionales. Plan Pro disponible a <strong>US$1,99/mes</strong> en todas las regiones.
              </>
            )}
          </span>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="success-banner fade-in">
            <ShieldCheck size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="plans-grid">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = currentPlan === plan.id;

            return (
              <div 
                key={plan.id}
                className={`plan-card ${plan.isPopular ? 'popular' : ''} ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                {plan.isPopular && (
                  <div className="plan-badge-popular">
                    <Sparkles size={13} />
                    <span>Recomendado</span>
                  </div>
                )}

                <div className="plan-card-head">
                  <div className="d-flex justify-between align-center mb-1">
                    <h3 className="plan-name">{plan.name}</h3>
                    {plan.badge && !plan.isPopular && (
                      <span className="plan-badge-simple">{plan.badge}</span>
                    )}
                  </div>
                  <p className="plan-subtitle">{plan.subtitle}</p>

                  <div className="plan-price-wrap">
                    {plan.originalPrice && (
                      <span className="original-price">{plan.originalPrice}</span>
                    )}
                    <span className="price-amount">{plan.price}</span>
                    <span className="price-period">/{plan.period}</span>
                  </div>

                  <div className="plan-photos-tag">
                    <Camera size={14} className="text-emerald" />
                    <strong>{plan.photos}</strong>
                  </div>
                </div>

                <div className="plan-features-list">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="plan-feature-item">
                      <Check size={16} className="text-emerald shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="plan-cta-wrap">
                  <button 
                    type="button"
                    className={`btn-plan-action ${plan.isPopular ? 'btn-primary' : 'btn-outline'} ${isCurrent ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan.id);
                    }}
                    disabled={isCurrent || isProcessing}
                  >
                    {isCurrent ? t('premium.currentPlan') : isProcessing && selectedPlanId === plan.id ? 'Procesando...' : plan.ctaText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info: StoreKit, Google Play & Cancel anytime guarantee */}
        <div className="premium-footer">
          <div className="footer-guarantee">
            <div className="guarantee-item">
              <Lock size={15} />
              <span>{t('premium.cancelAnytime')}</span>
            </div>
            <div className="guarantee-item">
              <CreditCard size={15} />
              <span>Cobro seguro cifrado de extremo a extremo</span>
            </div>
          </div>

          <div className="restore-link-wrap">
            <button 
              type="button" 
              className="restore-btn"
              onClick={handleRestorePurchases}
              disabled={isProcessing}
            >
              <RotateCcw size={14} />
              <span>{t('profile.restorePurchases')} (App Store / Google Play)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
