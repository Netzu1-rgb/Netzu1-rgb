import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Flame, 
  Utensils, 
  Camera, 
  User, 
  TrendingUp, 
  Activity,
  Crown,
  Moon,
  Sun,
  ShieldCheck,
  RotateCcw,
  Globe,
  LogOut,
  Fingerprint
} from 'lucide-react';

import { I18nProvider, useTranslation } from './i18n/I18nContext';
import OnboardingModal from './components/OnboardingModal';
import FoodScannerModal from './components/FoodScannerModal';
import DashboardView from './components/DashboardView';
import MealsView from './components/MealsView';
import ProgressView from './components/ProgressView';
import ProfileView from './components/ProfileView';
import PremiumModal from './components/PremiumModal';
import LanguageModal from './components/LanguageModal';
import MealScheduleModal, { DEFAULT_SCHEDULES } from './components/MealScheduleModal';
import AuthScreen from './components/AuthScreen';
import SecurityCenterModal from './components/SecurityCenterModal';

import { getCurrentSession, logoutUser } from './security/authService';
import { calculateNutritionTargets, generatePersonalizedMealPlan } from './nutritionEngine';
import './App.css';
import './mealsAndI18n.css';

function MainAppShell() {
  const { t, lang, isRTL } = useTranslation();

  // 1. Cybersecurity Authentication Session State
  const [currentUser, setCurrentUser] = useState(() => {
    const sessionRecord = getCurrentSession();
    return sessionRecord ? sessionRecord.user : null;
  });

  const [isSecurityCenterOpen, setIsSecurityCenterOpen] = useState(false);

  // 2. Theme State (Light by default, persistent)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('netai_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('netai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 3. Active Tab State for 5 Bottom Nav Items: 'dashboard' | 'meals' | 'progress' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');

  // 4. User Subscription & Quotas
  const [userPlan, setUserPlan] = useState(() => {
    return localStorage.getItem('netai_plan') || 'free'; // 'free' | 'basic' | 'pro'
  });

  const [photoCredits, setPhotoCredits] = useState(() => {
    const saved = localStorage.getItem('netai_photo_credits');
    if (saved !== null) return parseInt(saved, 10);
    return 3; // 3 free photos by default
  });

  const [userCountry, setUserCountry] = useState('AR'); // Regional detection (Argentina by default)

  // 5. Modals State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // 6. Water Intake State (Zero state default)
  const [waterGlasses, setWaterGlasses] = useState(() => {
    const saved = localStorage.getItem('netai_water_glasses');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const handleAddWater = () => {
    setWaterGlasses(prev => {
      const next = prev + 1;
      localStorage.setItem('netai_water_glasses', next.toString());
      return next;
    });
  };

  // 7. User Personalized Meal Schedules State
  const [mealSchedules, setMealSchedules] = useState(() => {
    const saved = localStorage.getItem('netai_meal_schedules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_SCHEDULES;
  });

  const handleUpdateMealSchedules = (newSchedules) => {
    setMealSchedules(newSchedules);
    localStorage.setItem('netai_meal_schedules', JSON.stringify(newSchedules));
  };

  // 7.5 Ethical Wellness Mode State (Hides numbers, focus on qualitative self-care)
  const [wellnessMode, setWellnessMode] = useState(() => {
    return localStorage.getItem('netai_wellness_mode') === 'true';
  });

  const handleToggleWellnessMode = () => {
    setWellnessMode(prev => {
      const next = !prev;
      localStorage.setItem('netai_wellness_mode', next.toString());
      return next;
    });
  };

  // 8. User Profile State (Starts clean from 0 for new account)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('netai_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: '',
      gender: 'male',
      age: 25,
      weight: 70,
      height: 175,
      targetWeight: 68,
      activityLevel: 'moderate',
      goal: 'maintain',
      dietType: 'balanced',
      allergies: [],
      preferredProteins: [],
      preferredCarbs: [],
      preferredFats: []
    };
  });

  // 9. Food Logs State (Pure Zero State - empty by default!)
  const [foodLogs, setFoodLogs] = useState(() => {
    const saved = localStorage.getItem('netai_food_logs');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // 10. Weight Tracking History State (Starts clean)
  const [weightHistory, setWeightHistory] = useState(() => {
    const saved = localStorage.getItem('netai_weight_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const handleAddWeightEntry = (entry) => {
    setWeightHistory(prev => {
      const updated = [...prev, entry];
      localStorage.setItem('netai_weight_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Nutrition targets calculation
  const targets = calculateNutritionTargets(profile);
  const mealPlan = generatePersonalizedMealPlan(profile, targets, mealSchedules);

  const handleCompleteOnboarding = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('netai_profile', JSON.stringify(newProfile));
    
    // Initialize initial weight entry if history is empty
    if (newProfile.weight && weightHistory.length === 0) {
      const initialEntry = {
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(newProfile.weight)
      };
      setWeightHistory([initialEntry]);
      localStorage.setItem('netai_weight_history', JSON.stringify([initialEntry]));
    }
    
    setIsOnboardingOpen(false);
  };

  const handleAddFood = (food) => {
    const foodWithDate = {
      ...food,
      date: food.date || new Date().toISOString().split('T')[0]
    };

    setFoodLogs(prev => {
      const updated = [foodWithDate, ...prev];
      localStorage.setItem('netai_food_logs', JSON.stringify(updated));
      return updated;
    });

    // Deduct 1 photo credit safely if added via camera/AI
    if (food.isFromAi) {
      setPhotoCredits(prev => {
        const updated = Math.max(0, prev - 1);
        localStorage.setItem('netai_photo_credits', updated.toString());
        return updated;
      });
    }
  };

  const handleRemoveFood = (id) => {
    setFoodLogs(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('netai_food_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateFood = (updatedItem) => {
    setFoodLogs(prev => {
      const updated = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
      localStorage.setItem('netai_food_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectPlan = (newPlan) => {
    setUserPlan(newPlan);
    localStorage.setItem('netai_plan', newPlan);

    let credits = 3;
    if (newPlan === 'basic') credits = 60;
    if (newPlan === 'pro') credits = 150;

    setPhotoCredits(credits);
    localStorage.setItem('netai_photo_credits', credits.toString());
  };

  // Auth Success Handlers
  const handleLoginSuccess = (user, triggerOnboarding = false) => {
    setCurrentUser(user);
    if (user?.name) {
      setProfile(prev => ({ ...prev, name: user.name }));
    }
    if (triggerOnboarding) {
      setIsOnboardingOpen(true);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleAccountDeleted = () => {
    setCurrentUser(null);
    setFoodLogs([]);
    setWaterGlasses(0);
    setWeightHistory([]);
    setProfile({
      name: '',
      gender: 'male',
      age: 25,
      weight: 70,
      height: 175,
      targetWeight: 68,
      activityLevel: 'moderate',
      goal: 'maintain',
      dietType: 'balanced',
      allergies: [],
      preferredProteins: [],
      preferredCarbs: [],
      preferredFats: []
    });
  };

  // If user is not authenticated, present the Cybersecurity Auth Portal
  if (!currentUser) {
    return (
      <div className={`auth-root-viewport ${isRTL ? 'is-rtl' : ''}`}>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
        
        {/* Onboarding Wizard (can be triggered right upon account creation) */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          initialData={profile}
          onComplete={handleCompleteOnboarding}
        />
      </div>
    );
  }

  return (
    <div className={`netai-app-shell ${isRTL ? 'is-rtl' : ''}`}>
      {/* Top Navbar */}
      <header className="main-navbar glass-panel">
        <div className="nav-brand-section" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="nav-logo-badge">
            <Zap size={20} className="text-emerald" />
          </div>
          <div>
            <h1 className="nav-brand-title">NetAI</h1>
            <span className="nav-brand-sub">Smart Calorie Vision</span>
          </div>
        </div>

        {/* Desktop Central Navigation */}
        <nav className="nav-tabs-desktop desktop-only">
          <button 
            type="button" 
            className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>{t('nav.home')}</span>
          </button>
          <button 
            type="button" 
            className={`nav-link-btn ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            <Utensils size={18} />
            <span>{t('nav.meals')}</span>
          </button>
          <button 
            type="button" 
            className={`nav-link-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <TrendingUp size={18} />
            <span>{t('nav.progress')}</span>
          </button>
          <button 
            type="button" 
            className={`nav-link-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>{t('nav.profile')}</span>
          </button>
        </nav>

        {/* Top Right Quick Actions */}
        <div className="nav-right-actions">
          {/* Subscription Badge Button */}
          <button 
            type="button" 
            className={`badge-plan-header ${userPlan}`}
            onClick={() => setIsPremiumOpen(true)}
            title="Ver planes de suscripción"
          >
            <Crown size={15} />
            <span className="desktop-only">{userPlan === 'pro' ? 'Pro' : userPlan === 'basic' ? 'Basic' : t('premium.free')}</span>
            <span className="credits-dot">{photoCredits}</span>
          </button>

          {/* Cybersecurity Center Button */}
          <button 
            type="button" 
            className="btn-icon-nav"
            onClick={() => setIsSecurityCenterOpen(true)}
            aria-label="Centro de Ciberseguridad"
            title="Centro de Ciberseguridad & Sesión"
          >
            <ShieldCheck size={18} className="text-emerald" />
          </button>

          {/* Quick Language Selector Button */}
          <button 
            type="button" 
            className="btn-icon-nav"
            onClick={() => setIsLanguageModalOpen(true)}
            aria-label="Seleccionar idioma"
            title={t('profile.language')}
          >
            <Globe size={18} />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button 
            type="button" 
            className="btn-icon-nav"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber" />}
          </button>

          {/* Logout Button (Desktop) */}
          <button 
            type="button" 
            className="btn-icon-nav desktop-only"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión segura"
          >
            <LogOut size={18} className="text-secondary" />
          </button>

          {/* Desktop Scan CTA Button */}
          <button 
            type="button" 
            className="btn-primary desktop-only"
            onClick={() => setIsScannerOpen(true)}
          >
            <Camera size={18} />
            <span>{t('nav.scan')}</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Content Layout */}
      <main className="main-content-viewport">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            profile={profile}
            targets={targets}
            foodLogs={foodLogs}
            waterGlasses={waterGlasses}
            onAddWater={handleAddWater}
            onOpenScanner={() => setIsScannerOpen(true)}
            onRemoveFood={handleRemoveFood}
            onOpenDietPlan={() => setActiveTab('meals')}
            photoCredits={photoCredits}
            plan={userPlan}
            onOpenPremium={() => setIsPremiumOpen(true)}
            wellnessMode={wellnessMode}
            onToggleWellnessMode={handleToggleWellnessMode}
          />
        )}

        {activeTab === 'meals' && (
          <MealsView
            profile={profile}
            targets={targets}
            foodLogs={foodLogs}
            onAddFood={handleAddFood}
            onRemoveFood={handleRemoveFood}
            onUpdateFood={handleUpdateFood}
            onOpenScanner={() => setIsScannerOpen(true)}
            mealPlan={mealPlan}
            onRegenerateDiet={() => setIsOnboardingOpen(true)}
            mealSchedules={mealSchedules}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            wellnessMode={wellnessMode}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            profile={profile}
            targets={targets}
            foodLogs={foodLogs}
            plan={userPlan}
            onOpenPremium={() => setIsPremiumOpen(true)}
            weightHistory={weightHistory}
            onAddWeightEntry={handleAddWeightEntry}
            wellnessMode={wellnessMode}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            profile={profile}
            targets={targets}
            plan={userPlan}
            photoCredits={photoCredits}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenEditProfile={() => setIsOnboardingOpen(true)}
            onOpenPremium={() => setIsPremiumOpen(true)}
            mealSchedules={mealSchedules}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onOpenSecurityCenter={() => setIsSecurityCenterOpen(true)}
            onLogout={handleLogout}
            wellnessMode={wellnessMode}
            onToggleWellnessMode={handleToggleWellnessMode}
          />
        )}
      </main>

      {/* 5-Section Native Bottom Navigation Bar for Mobile (iOS & Android) */}
      <nav className="mobile-bottom-nav">
        {/* 1. Inicio */}
        <button 
          type="button" 
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          aria-label={t('nav.home')}
        >
          <Activity size={20} />
          <span>{t('nav.home')}</span>
        </button>

        {/* 2. Comidas */}
        <button 
          type="button" 
          className={`mobile-nav-btn ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
          aria-label={t('nav.meals')}
        >
          <Utensils size={20} />
          <span>{t('nav.meals')}</span>
        </button>

        {/* 3. Escanear (Prominent Floating Shutter) */}
        <button 
          type="button" 
          className="mobile-nav-scan-cta"
          onClick={() => setIsScannerOpen(true)}
          aria-label={t('nav.scanTitle')}
        >
          <div className="scan-cta-glow" />
          <Camera size={26} color="#ffffff" />
        </button>

        {/* 4. Progreso */}
        <button 
          type="button" 
          className={`mobile-nav-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
          aria-label={t('nav.progress')}
        >
          <TrendingUp size={20} />
          <span>{t('nav.progress')}</span>
        </button>

        {/* 5. Perfil */}
        <button 
          type="button" 
          className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          aria-label={t('nav.profile')}
        >
          <User size={20} />
          <span>{t('nav.profile')}</span>
        </button>
      </nav>

      {/* Modals */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        initialData={profile}
        onComplete={handleCompleteOnboarding}
      />

      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddFood={(food) => handleAddFood({ ...food, isFromAi: true })}
        photoCredits={photoCredits}
        plan={userPlan}
        onOpenPremium={() => {
          setIsScannerOpen(false);
          setIsPremiumOpen(true);
        }}
      />

      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
        currentPlan={userPlan}
        onSelectPlan={handleSelectPlan}
        photoCredits={photoCredits}
        country={userCountry}
      />

      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      <MealScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        schedules={mealSchedules}
        onSave={handleUpdateMealSchedules}
      />

      <SecurityCenterModal
        isOpen={isSecurityCenterOpen}
        onClose={() => setIsSecurityCenterOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
        onAccountDeleted={handleAccountDeleted}
      />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <MainAppShell />
    </I18nProvider>
  );
}
