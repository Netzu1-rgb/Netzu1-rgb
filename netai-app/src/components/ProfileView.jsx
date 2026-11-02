import React, { useState } from 'react';
import { 
  User, 
  Target, 
  Scale, 
  Crown, 
  Shield, 
  RotateCcw, 
  ChevronRight, 
  Check, 
  Sparkles, 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  HelpCircle, 
  ExternalLink, 
  Zap, 
  Flame, 
  Droplets, 
  Sliders, 
  Clock, 
  Lock, 
  ShieldCheck, 
  LogOut,
  Heart
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import LanguageModal from './LanguageModal';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function ProfileView({ 
  currentUser,
  profile, 
  targets, 
  plan, 
  photoCredits, 
  theme, 
  onToggleTheme, 
  onOpenEditProfile, 
  onOpenPremium,
  mealSchedules = {},
  onOpenScheduleModal,
  onOpenSecurityCenter,
  onLogout,
  wellnessMode = false,
  onToggleWellnessMode
}) {
  const { t, lang, languages, units, setUnits } = useTranslation();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const currentLangObj = languages.find(l => l.code === lang) || { name: 'Español', nativeName: 'Español' };

  return (
    <div className="profile-view-container fade-in">
      {/* 1. Profile Header Card */}
      <div className="profile-hero-card glass-panel">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-circle">
            <User size={36} className="text-emerald" />
          </div>
          <div className="profile-title-col">
            <div className="d-flex align-center gap-2">
              <h2 className="profile-user-name">{currentUser?.name || profile.name || t('profile.user')}</h2>
              <span className={`plan-pill-badge ${plan}`}>
                {plan === 'pro' ? '👑 PRO' : plan === 'basic' ? '⚡ BASIC' : t('premium.free').toUpperCase()}
              </span>
            </div>
            <p className="profile-user-goal">
              {currentUser?.email ? `${currentUser.email} • ` : ''}
              {profile.gender === 'male' ? 'Atleta Masculino' : 'Atleta Femenina'} • {profile.age} años
            </p>
          </div>
        </div>

        <button 
          type="button" 
          onClick={plan !== 'free' ? onOpenEditProfile : onOpenPremium} 
          className={`btn-secondary btn-edit-profile ${plan === 'free' ? 'locked' : ''}`}
          title={plan === 'free' ? 'El registro de peso y objetivos requiere Basic o Pro' : 'Editar Biometría'}
        >
          {plan === 'free' ? (
            <>
              <Crown size={15} className="text-amber" />
              <span>Registro de Peso & Objetivos</span>
            </>
          ) : (
            'Editar Biometría'
          )}
        </button>
      </div>

      {/* 2. Subscription & AI Analysis Quota Status */}
      <div className="glass-panel profile-plan-card mt-3" onClick={onOpenPremium}>
        <div className="d-flex justify-between align-center">
          <div className="d-flex align-center gap-3">
            <div className="plan-icon-square">
              <Crown size={22} className="text-emerald" />
            </div>
            <div>
              <h3 className="profile-section-title">
                {plan === 'pro' ? t('premium.pro') : plan === 'basic' ? t('premium.basic') : t('premium.free')}
              </h3>
              <p className="plan-credits-sub">
                {t('scanner.quota', { count: photoCredits })}
              </p>
            </div>
          </div>
          <div className="d-flex align-center gap-2">
            <span className="btn-upgrade-hint">
              {plan === 'free' ? t('scanner.upgradeCta') : 'Gestionar'}
            </span>
            <ChevronRight size={18} className="text-secondary" />
          </div>
        </div>
      </div>

      {/* 3. Biometric Diagnostics Card */}
      <div className="glass-panel biometrics-summary-card mt-3">
        <div className="d-flex justify-between align-center mb-3">
          <h3 className="profile-section-title m-0">{t('profile.diagnostics')}</h3>
          {plan === 'free' && (
            <span className="plan-pill-mini-lock cursor-pointer" onClick={onOpenPremium}>
              <Lock size={12} /> BMR & Metas en Basic/Pro
            </span>
          )}
        </div>

        <div className="biometrics-row-grid">
          <div className="bio-stat-item">
            <span className="bio-lbl">{t('profile.currentWeight')}</span>
            <span className="bio-num">{profile.weight} {units === 'metric' ? 'kg' : 'lbs'}</span>
          </div>
          <div className="bio-stat-item">
            <span className="bio-lbl">{t('profile.targetWeight')}</span>
            {plan !== 'free' ? (
              <span className="bio-num text-emerald">{profile.targetWeight} {units === 'metric' ? 'kg' : 'lbs'}</span>
            ) : (
              <span className="bio-locked-tag cursor-pointer" onClick={onOpenPremium} title="Registro de peso y objetivos disponible en Basic y Pro">
                🔒 Premium
              </span>
            )}
          </div>
          <div className="bio-stat-item">
            <span className="bio-lbl">{t('profile.height')}</span>
            <span className="bio-num">{profile.height} {units === 'metric' ? 'cm' : 'in'}</span>
          </div>
          <div className="bio-stat-item">
            <span className="bio-lbl">IMC (BMI)</span>
            <span className="bio-num">{targets.bmi} <span className="bmi-tag">({targets.bmiCategory})</span></span>
          </div>
          <div className="bio-stat-item">
            <span className="bio-lbl">{t('profile.bmr')}</span>
            {plan !== 'free' ? (
              <span className="bio-num">{targets.bmr} kcal</span>
            ) : (
              <span className="bio-locked-tag cursor-pointer" onClick={onOpenPremium} title="Cálculo de BMR (Mifflin-St Jeor) disponible en Basic y Pro">
                🔒 Premium
              </span>
            )}
          </div>
          <div className="bio-stat-item">
            <span className="bio-lbl">{t('profile.tdee')}</span>
            {plan !== 'free' ? (
              <span className="bio-num">{targets.tdee} kcal</span>
            ) : (
              <span className="bio-locked-tag cursor-pointer" onClick={onOpenPremium} title="Cálculo de TDEE disponible en Basic y Pro">
                🔒 Premium
              </span>
            )}
          </div>
        </div>

        {plan === 'free' && (
          <div className="premium-feature-callout glass-panel mt-3 cursor-pointer" onClick={onOpenPremium}>
            <div className="d-flex align-center gap-2">
              <Crown size={18} className="text-amber" />
              <div>
                <strong className="callout-title">Cálculo de BMR/TDEE & Registro de Peso y Objetivos</strong>
                <p className="callout-desc m-0">Funciones reservadas para planes Basic y Pro. Activá tu seguimiento corporal integral.</p>
              </div>
            </div>
            <span className="btn-callout-action">Desbloquear</span>
          </div>
        )}
      </div>

      {/* 3.5 Personalized Meal Schedules Card */}
      <div className="glass-panel profile-schedules-card mt-3">
        <div className="d-flex justify-between align-center mb-3">
          <div className="d-flex align-center gap-2">
            <Clock size={18} className="text-emerald" />
            <h3 className="profile-section-title m-0">Horarios de Comidas</h3>
          </div>
          <button 
            type="button" 
            onClick={onOpenScheduleModal}
            className="btn-edit-schedules-subtle"
          >
            Personalizar
          </button>
        </div>

        <div className="profile-schedules-grid">
          <div className="profile-schedule-chip">
            <span className="sched-lbl">🌅 Desayuno</span>
            <span className="sched-val">{mealSchedules?.breakfast?.time || mealSchedules?.breakfast || '08:30'}</span>
          </div>
          <div className="profile-schedule-chip">
            <span className="sched-lbl">🍽️ Almuerzo</span>
            <span className="sched-val">{mealSchedules?.lunch?.time || mealSchedules?.lunch || '13:30'}</span>
          </div>
          <div className="profile-schedule-chip">
            <span className="sched-lbl">☕ Merienda</span>
            <span className="sched-val">{mealSchedules?.afternoonSnack?.time || mealSchedules?.afternoonSnack || '17:00'}</span>
          </div>
          <div className="profile-schedule-chip">
            <span className="sched-lbl">🌙 Cena</span>
            <span className="sched-val">{mealSchedules?.dinner?.time || mealSchedules?.dinner || '21:00'}</span>
          </div>
        </div>
      </div>

      {/* 4. App Preferences & Appearance */}
      <div className="glass-panel settings-group-card mt-3">
        <h3 className="profile-section-title mb-2">{t('profile.preferences')}</h3>
        
        {/* Dark Mode Toggle */}
        <div className="settings-row">
          <div className="d-flex align-center gap-2">
            {theme === 'dark' ? <Moon size={18} className="text-secondary" /> : <Sun size={18} className="text-amber" />}
            <div>
              <span className="settings-label">{t('profile.darkMode')}</span>
              <span className="settings-sub">{t('profile.darkModeDesc')}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onToggleTheme} 
            className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
            aria-label="Alternar modo oscuro"
          >
            <div className="toggle-thumb" />
          </button>
        </div>

        {/* Global Language Selector Trigger */}
        <div className="settings-row border-top cursor-pointer" onClick={() => setIsLangModalOpen(true)}>
          <div className="d-flex align-center gap-2">
            <Globe size={18} className="text-emerald" />
            <div>
              <span className="settings-label">{t('profile.language')}</span>
              <span className="settings-sub">{t('profile.languageDesc')}</span>
            </div>
          </div>
          <div className="d-flex align-center gap-2">
            <span className="current-lang-pill">
              {currentLangObj.nativeName} ({currentLangObj.code})
            </span>
            <ChevronRight size={18} className="text-secondary" />
          </div>
        </div>

        {/* Units System Selector */}
        <div className="settings-row border-top">
          <div className="d-flex align-center gap-2">
            <Sliders size={18} className="text-secondary" />
            <div>
              <span className="settings-label">{t('profile.units')}</span>
              <span className="settings-sub">
                {units === 'metric' ? t('profile.metric') : t('profile.imperial')}
              </span>
            </div>
          </div>
          <div className="segmented-control small">
            <button 
              type="button" 
              className={`seg-btn ${units === 'metric' ? 'active' : ''}`}
              onClick={() => setUnits('metric')}
            >
              kg / g
            </button>
            <button 
              type="button" 
              className={`seg-btn ${units === 'imperial' ? 'active' : ''}`}
              onClick={() => setUnits('imperial')}
            >
              lbs / oz
            </button>
          </div>
        </div>

        {/* Modo Bienestar (Wellness Mode - Sin Números) */}
        <div className="settings-row border-top">
          <div className="d-flex align-center gap-2">
            <Heart size={18} className="text-emerald" />
            <div>
              <span className="settings-label">Modo Bienestar (Sin Números)</span>
              <span className="settings-sub">Oculta calorías y macros en toda la app para un registro intuitivo y compasivo</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onToggleWellnessMode} 
            className={`toggle-switch ${wellnessMode ? 'active' : ''}`}
            aria-label="Alternar modo bienestar sin números"
          >
            <div className="toggle-thumb" />
          </button>
        </div>

        {/* Cybersecurity & 2FA Control */}
        <div className="settings-row border-top cursor-pointer" onClick={onOpenSecurityCenter}>
          <div className="d-flex align-center gap-2">
            <ShieldCheck size={18} className="text-emerald" />
            <div>
              <span className="settings-label">Centro de Ciberseguridad & 2FA</span>
              <span className="settings-sub">PBKDF2-SHA256, Doble Factor, Auditoría y Privacidad</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-secondary" />
        </div>

        {/* Security & Restore Purchases */}
        <div className="settings-row border-top cursor-pointer" onClick={onOpenPremium}>
          <div className="d-flex align-center gap-2">
            <RotateCcw size={18} className="text-secondary" />
            <div>
              <span className="settings-label">{t('profile.restorePurchases')}</span>
              <span className="settings-sub">{t('profile.restorePurchasesDesc')}</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-secondary" />
        </div>

        {/* Logout Row */}
        <div className="settings-row border-top cursor-pointer" onClick={onLogout} style={{ color: 'var(--brand-red, #ef4444)' }}>
          <div className="d-flex align-center gap-2">
            <LogOut size={18} className="text-red" />
            <div>
              <span className="settings-label text-red">Cerrar Sesión</span>
              <span className="settings-sub">Finalizar la sesión segura en este dispositivo</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-secondary" />
        </div>
      </div>

      {/* Mandatory Ethical & Medical Disclaimer */}
      <div className="mt-4">
        <MedicalDisclaimer compact />
      </div>

      {/* 5. Version and Legal Notice */}
      <div className="profile-legal-footer mt-2 mb-4">
        <p className="legal-text">
          NetAI Smart Calorie Vision v2.5.0 (Enfoque Neutral de Salud)
        </p>
        <p className="legal-subtext">
          {t('scanner.disclaimer')}
        </p>
      </div>

      {/* Global Language Modal */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
}
