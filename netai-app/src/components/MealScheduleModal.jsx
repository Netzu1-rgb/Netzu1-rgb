import React, { useState } from 'react';
import { 
  Clock, 
  X, 
  Check, 
  Sun, 
  Utensils, 
  Coffee, 
  Moon, 
  Cookie, 
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  ChevronRight,
  Info
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export const DEFAULT_SCHEDULES = {
  breakfast: { time: '08:30', reminder: true },
  lunch: { time: '13:30', reminder: true },
  afternoonSnack: { time: '17:00', reminder: false },
  dinner: { time: '21:00', reminder: true },
  snacks: { time: '11:00', reminder: false }
};

export const ROUTINE_PRESETS = [
  {
    id: 'early_bird',
    name: 'Madrugador',
    desc: 'Ideal para quienes entrenan o trabajan temprano',
    icon: '🌅',
    schedules: {
      breakfast: '07:00',
      lunch: '12:30',
      afternoonSnack: '16:30',
      dinner: '20:00',
      snacks: '10:30'
    }
  },
  {
    id: 'standard',
    name: 'Habitual / Oficina',
    desc: 'El balance clásico de 4 a 5 comidas diarias',
    icon: '💼',
    schedules: {
      breakfast: '08:30',
      lunch: '13:30',
      afternoonSnack: '17:30',
      dinner: '21:30',
      snacks: '11:30'
    }
  },
  {
    id: 'intermittent_fasting',
    name: 'Ayuno 16/8',
    desc: 'Ventana de ingesta de 12:00 a 20:00 hs',
    icon: '⏳',
    schedules: {
      breakfast: '12:00',
      lunch: '14:30',
      afternoonSnack: '17:30',
      dinner: '20:00',
      snacks: '16:00'
    }
  },
  {
    id: 'night_owl',
    name: 'Horario Nocturno',
    desc: 'Para quienes inician el día más tarde',
    icon: '🌙',
    schedules: {
      breakfast: '10:30',
      lunch: '14:30',
      afternoonSnack: '18:30',
      dinner: '22:30',
      snacks: '12:30'
    }
  }
];

const MEAL_CONFIGS = [
  { 
    id: 'breakfast', 
    nameKey: 'meals.breakfast', 
    defaultName: 'Desayuno', 
    icon: Sun, 
    color: '#F59E0B',
    quickTimes: ['07:00', '07:30', '08:00', '08:30', '09:00']
  },
  { 
    id: 'lunch', 
    nameKey: 'meals.lunch', 
    defaultName: 'Almuerzo', 
    icon: Utensils, 
    color: '#10B981',
    quickTimes: ['12:30', '13:00', '13:30', '14:00', '14:30']
  },
  { 
    id: 'afternoonSnack', 
    nameKey: 'meals.afternoonSnack', 
    defaultName: 'Merienda', 
    icon: Coffee, 
    color: '#06B6D4',
    quickTimes: ['16:00', '16:30', '17:00', '17:30', '18:00']
  },
  { 
    id: 'dinner', 
    nameKey: 'meals.dinner', 
    defaultName: 'Cena', 
    icon: Moon, 
    color: '#8B5CF6',
    quickTimes: ['20:00', '20:30', '21:00', '21:30', '22:00']
  },
  { 
    id: 'snacks', 
    nameKey: 'meals.snacks', 
    defaultName: 'Snacks / Colaciones', 
    icon: Cookie, 
    color: '#EC4899',
    quickTimes: ['10:30', '11:00', '11:30', '15:30', '19:00']
  }
];

// Helper to normalize schedule object or string
function normalizeSchedule(val, defaultTime = '08:00') {
  if (!val) return { time: defaultTime, reminder: true };
  if (typeof val === 'string') return { time: val, reminder: true };
  return { time: val.time || defaultTime, reminder: val.reminder !== false };
}

// Helper to convert time "HH:MM" to minutes for sorting & timeline
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10) || 0);
  return h * 60 + m;
}

export default function MealScheduleModal({ isOpen, onClose, schedules, onSave }) {
  const { t } = useTranslation();

  // Normalize initial data
  const [localSchedules, setLocalSchedules] = useState(() => {
    const base = {};
    MEAL_CONFIGS.forEach(cat => {
      base[cat.id] = normalizeSchedule(schedules?.[cat.id], DEFAULT_SCHEDULES[cat.id]?.time);
    });
    // Add any custom extra meals if present
    if (schedules) {
      Object.keys(schedules).forEach(key => {
        if (!base[key] && schedules[key]?.isCustom) {
          base[key] = schedules[key];
        }
      });
    }
    return base;
  });

  const [activePreset, setActivePreset] = useState(null);
  const [notificationGranted, setNotificationGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customMealName, setCustomMealName] = useState('');
  const [customMealTime, setCustomMealTime] = useState('11:00');

  if (!isOpen) return null;

  // Handle time change for category
  const handleTimeChange = (id, newTime) => {
    setActivePreset(null);
    setLocalSchedules(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        time: newTime
      }
    }));
  };

  // Toggle reminder for category
  const handleToggleReminder = async (id) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        setNotificationGranted(perm === 'granted');
      } catch (e) {}
    }

    setLocalSchedules(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        reminder: !prev[id]?.reminder
      }
    }));
  };

  // Apply Routine Preset
  const handleApplyPreset = (preset) => {
    setActivePreset(preset.id);
    setLocalSchedules(prev => {
      const updated = { ...prev };
      Object.entries(preset.schedules).forEach(([catId, timeVal]) => {
        updated[catId] = {
          ...(updated[catId] || {}),
          time: timeVal
        };
      });
      return updated;
    });
  };

  // Reset to default
  const handleResetDefaults = () => {
    setActivePreset(null);
    const reset = {};
    MEAL_CONFIGS.forEach(cat => {
      reset[cat.id] = { ...DEFAULT_SCHEDULES[cat.id] };
    });
    setLocalSchedules(reset);
  };

  // Add custom extra meal
  const handleAddCustomMeal = () => {
    if (!customMealName.trim()) return;
    const customId = `custom_${Date.now()}`;
    setLocalSchedules(prev => ({
      ...prev,
      [customId]: {
        name: customMealName.trim(),
        time: customMealTime || '11:00',
        reminder: true,
        isCustom: true
      }
    }));
    setCustomMealName('');
    setCustomMealTime('11:00');
    setShowAddCustom(false);
  };

  // Remove custom meal
  const handleRemoveCustomMeal = (id) => {
    setLocalSchedules(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Save changes
  const handleSaveAll = () => {
    onSave(localSchedules);
    onClose();
  };

  // Calculate day interval metrics
  const sortedTimes = Object.entries(localSchedules)
    .filter(([_, data]) => data?.time)
    .map(([id, data]) => ({ id, name: data.name || t(`meals.${id}`) || id, time: data.time, mins: timeToMinutes(data.time) }))
    .sort((a, b) => a.mins - b.mins);

  const firstMeal = sortedTimes[0];
  const lastMeal = sortedTimes[sortedTimes.length - 1];
  const feedingWindowMins = firstMeal && lastMeal ? Math.max(0, lastMeal.mins - firstMeal.mins) : 0;
  const feedingHours = Math.floor(feedingWindowMins / 60);
  const feedingRemainderMins = feedingWindowMins % 60;

  return (
    <div className="onboarding-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="meal-schedule-modal glass-panel fade-in" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        {/* Modal Header */}
        <div className="schedule-modal-header">
          <div className="d-flex align-center gap-3">
            <div className="schedule-header-icon-wrap">
              <Clock size={24} className="text-emerald" />
            </div>
            <div>
              <h2 id="schedule-modal-title" className="schedule-modal-title">
                Mis Horarios de Comidas
              </h2>
              <p className="schedule-modal-sub">
                Personalizá a qué hora desayunás, almorzás y cenás según tu rutina diaria.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-close-modal"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="schedule-modal-body">
          {/* 1. Quick Routine Presets Strip */}
          <div className="schedule-presets-section mb-4">
            <div className="d-flex align-center justify-between mb-2">
              <span className="section-meta-label">
                <Sparkles size={14} className="text-emerald" />
                Rutinas Predefinidas Rápidas:
              </span>
              <button 
                type="button" 
                onClick={handleResetDefaults} 
                className="btn-text-subtle"
              >
                <RotateCcw size={13} />
                Restablecer estándar
              </button>
            </div>

            <div className="presets-chips-grid">
              {ROUTINE_PRESETS.map((p) => {
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`preset-card-btn ${isSelected ? 'active' : ''}`}
                  >
                    <span className="preset-emoji">{p.icon}</span>
                    <div className="preset-info">
                      <span className="preset-name">{p.name}</span>
                      <span className="preset-desc">{p.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Interactive Daily Timeline Visualizer */}
          <div className="daily-timeline-card glass-panel mb-4">
            <div className="timeline-header-meta">
              <span className="timeline-title">
                Ventana de Ingesta Diaria: <strong>{feedingHours}h {feedingRemainderMins > 0 ? `${feedingRemainderMins}m` : ''}</strong>
              </span>
              <span className="timeline-first-last">
                {firstMeal?.time} → {lastMeal?.time}
              </span>
            </div>

            <div className="timeline-track-bar">
              {sortedTimes.map((item) => {
                const pct = (item.mins / (24 * 60)) * 100;
                return (
                  <div 
                    key={item.id} 
                    className="timeline-marker"
                    style={{ left: `${Math.min(96, Math.max(4, pct))}%` }}
                    title={`${item.name}: ${item.time}`}
                  >
                    <div className="marker-dot" />
                    <span className="marker-lbl">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Main Meal Cards List (Desayuno, Almuerzo, Merienda, Cena, Snacks) */}
          <div className="schedule-items-stack">
            {MEAL_CONFIGS.map((config) => {
              const IconComp = config.icon;
              const scheduleData = localSchedules[config.id] || { time: '08:00', reminder: true };
              const mealName = t(config.nameKey) || config.defaultName;

              return (
                <div key={config.id} className="meal-schedule-item-card glass-panel">
                  {/* Top Row: Left Info + Right Controls */}
                  <div className="meal-card-top-row">
                    <div className="item-card-left">
                      <div 
                        className="meal-schedule-icon"
                        style={{ backgroundColor: `${config.color}18`, color: config.color }}
                      >
                        <IconComp size={20} />
                      </div>
                      <div>
                        <h3 className="meal-schedule-name">{mealName}</h3>
                        <span className="meal-schedule-hint">
                          Horario diario recomendado
                        </span>
                      </div>
                    </div>

                    <div className="meal-card-controls-right">
                      <div className="time-input-wrap">
                        <input 
                          type="time" 
                          value={scheduleData.time}
                          onChange={(e) => handleTimeChange(config.id, e.target.value)}
                          className="schedule-time-native-input"
                          aria-label={`Horario para ${mealName}`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleReminder(config.id)}
                        className={`btn-reminder-toggle ${scheduleData.reminder ? 'active' : ''}`}
                        title={scheduleData.reminder ? 'Recordatorio activado' : 'Recordatorio desactivado'}
                      >
                        {scheduleData.reminder ? <Bell size={16} /> : <BellOff size={16} />}
                        <span>
                          {scheduleData.reminder ? 'Aviso ON' : 'Aviso OFF'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Quick Time Suggestions evenly spaced */}
                  <div className="meal-card-chips-row">
                    <span className="chips-row-label">Horarios sugeridos:</span>
                    <div className="quick-times-row">
                      {config.quickTimes.map((qTime) => (
                        <button
                          key={qTime}
                          type="button"
                          onClick={() => handleTimeChange(config.id, qTime)}
                          className={`btn-time-chip ${scheduleData.time === qTime ? 'active' : ''}`}
                        >
                          {qTime}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom Extra Meals Added by User */}
            {Object.entries(localSchedules)
              .filter(([_, data]) => data?.isCustom)
              .map(([customId, customData]) => (
                <div key={customId} className="meal-schedule-item-card glass-panel custom-meal-card">
                  <div className="item-card-left">
                    <div className="meal-schedule-icon custom">
                      <Sparkles size={20} className="text-emerald" />
                    </div>
                    <div>
                      <h3 className="meal-schedule-name">{customData.name}</h3>
                      <span className="meal-schedule-hint">Comida personalizada</span>
                    </div>
                  </div>

                  <div className="item-card-center">
                    <div className="time-input-wrap">
                      <input 
                        type="time" 
                        value={customData.time}
                        onChange={(e) => handleTimeChange(customId, e.target.value)}
                        className="schedule-time-native-input"
                      />
                      <Clock size={16} className="time-input-clock-icon text-secondary" />
                    </div>
                  </div>

                  <div className="item-card-right d-flex gap-2 align-center">
                    <button
                      type="button"
                      onClick={() => handleToggleReminder(customId)}
                      className={`btn-reminder-toggle ${customData.reminder ? 'active' : ''}`}
                    >
                      {customData.reminder ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomMeal(customId)}
                      className="btn-trash-custom"
                      title="Eliminar comida personalizada"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* 4. Add Extra Custom Meal Accordion */}
          <div className="add-custom-meal-wrapper mt-3">
            {!showAddCustom ? (
              <button 
                type="button" 
                onClick={() => setShowAddCustom(true)} 
                className="btn-add-custom-meal-trigger"
              >
                <Plus size={16} />
                <span>Agregar otra comida o colación personalizada (ej. Post-Entreno, Media Mañana)</span>
              </button>
            ) : (
              <div className="add-custom-box glass-panel fade-in">
                <div className="d-flex justify-between align-center mb-3">
                  <h4 className="m-0 font-600">Nueva Comida Personalizada</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCustom(false)} 
                    className="btn-close-sub"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="custom-input-grid">
                  <div>
                    <label className="input-field-lbl">Nombre de la comida:</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Post-Entrenamiento, Media Mañana..." 
                      value={customMealName}
                      onChange={(e) => setCustomMealName(e.target.value)}
                      className="form-input"
                    />
                    {/* Quick suggested chips */}
                    <div className="custom-name-chips mt-1">
                      {['Media Mañana', 'Post-Entreno', 'Pre-Cama', 'Merienda 2'].map(sugg => (
                        <button 
                          key={sugg} 
                          type="button" 
                          className="chip-suggestion"
                          onClick={() => setCustomMealName(sugg)}
                        >
                          + {sugg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="input-field-lbl">Horario estimado:</label>
                    <input 
                      type="time" 
                      value={customMealTime}
                      onChange={(e) => setCustomMealTime(e.target.value)}
                      className="form-input time-pick"
                    />
                  </div>
                </div>

                <div className="d-flex justify-end gap-2 mt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddCustom(false)} 
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAddCustomMeal} 
                    className="btn-primary"
                    disabled={!customMealName.trim()}
                  >
                    <Plus size={16} />
                    Agregar Comida
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="schedule-modal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleSaveAll} 
            className="btn-primary btn-save-schedules"
          >
            <Check size={18} />
            Guardar Mis Horarios
          </button>
        </div>
      </div>
    </div>
  );
}
