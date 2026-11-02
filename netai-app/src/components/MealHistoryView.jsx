import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  RotateCcw, 
  Search, 
  Filter, 
  FileText, 
  Check, 
  Copy, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  Award, 
  Layers, 
  Calendar, 
  Sun, 
  Utensils, 
  Coffee, 
  Moon, 
  Cookie, 
  Trash2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import CustomDropdown from './CustomDropdown';

export default function MealHistoryView({ 
  foodLogs = [], 
  targets, 
  profile, 
  onDuplicateFood, 
  onRemoveFood,
  categories = [] 
}) {
  const { t, formatNumber, formatDate } = useTranslation();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'breakfast' | 'lunch' | ...
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'week' | 'month'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'calories_high' | 'protein_high'
  const [copiedReportToast, setCopiedReportToast] = useState(false);
  const [actionToast, setActionToast] = useState('');

  const showToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 2200);
  };

  // Helper to map category id to icon and title
  const getCategoryMeta = (catId) => {
    const found = categories.find(c => c.id === catId);
    if (found) return found;

    switch (catId) {
      case 'breakfast':
        return { name: t('meals.breakfast'), icon: Sun, color: '#F59E0B' };
      case 'lunch':
        return { name: t('meals.lunch'), icon: Utensils, color: '#10B981' };
      case 'afternoonSnack':
        return { name: t('meals.afternoonSnack'), icon: Coffee, color: '#06B6D4' };
      case 'dinner':
        return { name: t('meals.dinner'), icon: Moon, color: '#8B5CF6' };
      default:
        return { name: t('meals.snacks'), icon: Cookie, color: '#EC4899' };
    }
  };

  // Date parsing helper
  const todayKey = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Filtered and Sorted Logs
  const filteredLogs = useMemo(() => {
    let list = [...foodLogs];

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.portion && item.portion.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(item => (item.category || 'breakfast') === selectedCategory);
    }

    // Date range filter
    if (dateFilter !== 'all') {
      const daysLimit = dateFilter === 'week' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysLimit);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      list = list.filter(item => {
        const itemDate = item.date || todayKey;
        return itemDate >= cutoffStr;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'calories_high') {
        return (Number(b.calories) || 0) - (Number(a.calories) || 0);
      }
      if (sortBy === 'protein_high') {
        return (Number(b.protein) || 0) - (Number(a.protein) || 0);
      }
      // 'newest' (date + time)
      const dateA = a.date || todayKey;
      const dateB = b.date || todayKey;
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.id || 0) - (a.id || 0);
    });

    return list;
  }, [foodLogs, searchQuery, selectedCategory, dateFilter, sortBy, todayKey]);

  // Group filtered logs by date (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredLogs.forEach(item => {
      const dateKey = item.date || todayKey;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    // Convert to sorted array of [dateKey, items]
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [filteredLogs, todayKey]);

  // Aggregate Clinical Analytics
  const analytics = useMemo(() => {
    const totalLogs = foodLogs.length;
    if (totalLogs === 0) {
      return {
        totalMeals: 0,
        avgCaloriesDay: 0,
        avgProteinDay: 0,
        adherenceRate: 0,
        distinctDaysCount: 0
      };
    }

    // Count distinct dates
    const distinctDates = new Set(foodLogs.map(f => f.date || todayKey));
    const daysCount = Math.max(1, distinctDates.size);

    const totalCals = foodLogs.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
    const totalProtein = foodLogs.reduce((acc, curr) => acc + (Number(curr.protein) || 0), 0);

    const avgCals = Math.round(totalCals / daysCount);
    const avgProtein = Math.round(totalProtein / daysCount);

    const targetCals = targets?.targetCalories || 2000;
    const deviation = Math.abs(avgCals - targetCals) / targetCals;
    const adherence = Math.min(100, Math.max(65, Math.round((1 - deviation * 0.7) * 100)));

    return {
      totalMeals: totalLogs,
      avgCaloriesDay: avgCals,
      avgProteinDay: avgProtein,
      adherenceRate: adherence,
      distinctDaysCount: daysCount
    };
  }, [foodLogs, todayKey, targets]);

  // Format date header nicely (e.g. "Hoy, 26 de Octubre" / "Ayer, 25 de Octubre")
  const formatDateHeading = (dateStr) => {
    if (dateStr === todayKey) return 'Hoy';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split('T')[0];
    if (dateStr === yestStr) return 'Ayer';

    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  // Generate & Export Clinical Nutrition Report
  const handleExportClinicalReport = () => {
    const distinctDates = Array.from(new Set(foodLogs.map(f => f.date || todayKey)));
    const lines = [
      '======================================================',
      '        NETAI - INFORME CLÍNICO DE BITÁCORA NUTRICIONAL',
      '======================================================',
      `Fecha de exportación: ${new Date().toLocaleString()}`,
      `Atleta / Paciente: ${profile.gender === 'male' ? 'Masculino' : 'Femenino'} | ${profile.age} años | ${profile.weight} kg`,
      `Objetivo calórico diario: ${targets.targetCalories} kcal (BMR: ${targets.bmr} kcal | TDEE: ${targets.tdee} kcal)`,
      `Días auditados: ${distinctDates.length} días | Total de registros: ${foodLogs.length} comidas`,
      `Promedio calórico real: ${analytics.avgCaloriesDay} kcal/día (${analytics.adherenceRate}% adherencia)`,
      `Aporte proteico promedio: ${analytics.avgProteinDay} g/día (~${(analytics.avgProteinDay / (parseFloat(profile.weight) || 70)).toFixed(1)} g/kg)`,
      '------------------------------------------------------',
      'DESGLOSE CRONOLÓGICO POR DÍA:',
      '------------------------------------------------------'
    ];

    groupedByDate.forEach(([dateKey, items]) => {
      const dayCals = items.reduce((acc, c) => acc + (Number(c.calories) || 0), 0);
      const dayProt = items.reduce((acc, c) => acc + (Number(c.protein) || 0), 0);
      lines.push(`\n[${dateKey}] - Total: ${dayCals} kcal | P: ${dayProt}g | ${items.length} comidas`);
      items.forEach(item => {
        lines.push(`  • [${item.time || '12:00'}] ${item.name} (${item.portion || '1 porción'}) -> ${item.calories} kcal | P:${item.protein || 0}g C:${item.carbs || 0}g G:${item.fat || 0}g`);
      });
    });

    lines.push('\n======================================================');
    lines.push('Generado con NetAI Sports & Clinical Nutrition Engine');
    lines.push('======================================================');

    const reportText = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      setCopiedReportToast(true);
      setTimeout(() => setCopiedReportToast(false), 2600);
    }
  };

  return (
    <div className="meal-history-container fade-in">
      {/* Toast Feedback */}
      {copiedReportToast && (
        <div className="meals-toast-notification fade-in">
          <Check size={16} />
          <span>¡Reporte clínico copiado al portapapeles con éxito!</span>
        </div>
      )}

      {actionToast && (
        <div className="meals-toast-notification fade-in">
          <Check size={16} />
          <span>{actionToast}</span>
        </div>
      )}

      {/* 1. Clinical & Sports Header Banner */}
      <div className="history-hero-panel glass-panel mb-4">
        <div className="history-hero-left">
          <div className="d-flex align-center gap-2 mb-2">
            <span className="audit-clinical-badge">
              <ShieldCheck size={14} />
              Auditoría Nutricional Continua
            </span>
            <span className="audit-meta-pill">
              Fórmula Mifflin-St Jeor
            </span>
            <span className="audit-meta-pill">
              {analytics.distinctDaysCount} {analytics.distinctDaysCount === 1 ? 'día registrado' : 'días registrados'}
            </span>
          </div>

          <h2 className="history-hero-title">
            Bitácora Nutricional & Historial de Ingesta
          </h2>
          <p className="history-hero-desc">
            Registro cronológico detallado de densidad calórica, biodisponibilidad proteica y balance de macronutrientes para optimizar tu rendimiento y composición corporal.
          </p>
        </div>

        <div className="history-hero-right">
          <button 
            type="button" 
            onClick={handleExportClinicalReport} 
            className="btn-export-clinical"
            title="Copiar informe completo al portapapeles"
          >
            <FileText size={16} />
            <span>Exportar Reporte</span>
          </button>
        </div>
      </div>

      {/* 2. Clinical Performance KPIs Bar */}
      <div className="history-kpis-grid mb-4">
        {/* KPI 1: Total Registros */}
        <div className="history-kpi-card glass-panel">
          <div className="d-flex align-center justify-between mb-1">
            <span className="kpi-micro-lbl">Comidas Auditadas</span>
            <div className="kpi-micro-icon emerald">
              <Layers size={16} />
            </div>
          </div>
          <div className="kpi-micro-value">{analytics.totalMeals}</div>
          <span className="kpi-micro-sub">
            En {analytics.distinctDaysCount} {analytics.distinctDaysCount === 1 ? 'jornada' : 'jornadas'} de registro
          </span>
        </div>

        {/* KPI 2: Promedio Calórico */}
        <div className="history-kpi-card glass-panel">
          <div className="d-flex align-center justify-between mb-1">
            <span className="kpi-micro-lbl">Promedio Calórico</span>
            <div className="kpi-micro-icon amber">
              <Flame size={16} />
            </div>
          </div>
          <div className="kpi-micro-value">
            {formatNumber(analytics.avgCaloriesDay)} <span className="kpi-micro-unit">kcal/d</span>
          </div>
          <span className="kpi-micro-sub">
            Meta: {formatNumber(targets?.targetCalories || 2000)} kcal
          </span>
        </div>

        {/* KPI 3: Aporte Proteico */}
        <div className="history-kpi-card glass-panel">
          <div className="d-flex align-center justify-between mb-1">
            <span className="kpi-micro-lbl">Proteína Diaria Media</span>
            <div className="kpi-micro-icon cyan">
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-micro-value">
            {analytics.avgProteinDay}g <span className="kpi-micro-unit">/día</span>
          </div>
          <span className="kpi-micro-sub">
            ~{(analytics.avgProteinDay / (parseFloat(profile.weight) || 70)).toFixed(1)}g / kg peso
          </span>
        </div>

        {/* KPI 4: Adherencia Dietética */}
        <div className="history-kpi-card glass-panel">
          <div className="d-flex align-center justify-between mb-1">
            <span className="kpi-micro-lbl">Índice de Adherencia</span>
            <div className="kpi-micro-icon purple">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-micro-value text-emerald">{analytics.adherenceRate}%</div>
          <div className="mini-adherence-track mt-1">
            <div 
              className="mini-adherence-fill" 
              style={{ width: `${analytics.adherenceRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 3. Advanced Search & Control Bar */}
      <div className="history-controls-card glass-panel mb-4">
        {/* Row 1: Search & Sort */}
        <div className="controls-row-top">
          <div className="history-search-wrap">
            <Search size={16} className="history-search-icon" />
            <input 
              type="text" 
              placeholder="Buscar en el historial (ej. pollo, avena, batido)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="btn-clear-search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="history-sort-wrap">
            <CustomDropdown
              value={sortBy}
              onChange={setSortBy}
              triggerIcon={SlidersHorizontal}
              menuAlign="right"
              options={[
                {
                  value: 'newest',
                  label: 'Más recientes primero',
                  desc: 'Orden cronológico de ingesta',
                  icon: Clock,
                  color: '#10B981',
                  badge: 'Recientes'
                },
                {
                  value: 'calories_high',
                  label: 'Mayor aporte calórico',
                  desc: 'Mayor densidad de calorías (kcal)',
                  icon: Flame,
                  color: '#F59E0B',
                  badge: 'Kcal ↑'
                },
                {
                  value: 'protein_high',
                  label: 'Mayor contenido proteico',
                  desc: 'Mayor cantidad de gramos de proteína',
                  icon: Sparkles,
                  color: '#3B82F6',
                  badge: 'Proteína ↑'
                }
              ]}
              ariaLabel="Ordenar historial de comidas"
            />
          </div>
        </div>

        {/* Row 2: Filter Pills (Categories & Dates) */}
        <div className="controls-row-filters mt-3">
          {/* Category Filter Pills */}
          <div className="filter-chips-cluster">
            <span className="cluster-label">Comida:</span>
            <button 
              type="button" 
              className={`filter-chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Todas
            </button>
            <button 
              type="button" 
              className={`filter-chip-btn ${selectedCategory === 'breakfast' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('breakfast')}
            >
              Desayuno
            </button>
            <button 
              type="button" 
              className={`filter-chip-btn ${selectedCategory === 'lunch' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('lunch')}
            >
              Almuerzo
            </button>
            <button 
              type="button" 
              className={`filter-chip-btn ${selectedCategory === 'afternoonSnack' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('afternoonSnack')}
            >
              Merienda
            </button>
            <button 
              type="button" 
              className={`filter-chip-btn ${selectedCategory === 'dinner' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('dinner')}
            >
              Cena
            </button>
            <button 
              type="button" 
              className={`filter-chip-btn ${selectedCategory === 'snacks' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('snacks')}
            >
              Snacks
            </button>
          </div>

          {/* Date Filter Pills */}
          <div className="filter-chips-cluster ml-auto">
            <span className="cluster-label">Período:</span>
            <button 
              type="button" 
              className={`filter-chip-btn small ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              Todo
            </button>
            <button 
              type="button" 
              className={`filter-chip-btn small ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => setDateFilter('week')}
            >
              7 días
            </button>
            <button 
              type="button" 
              className={`filter-chip-btn small ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => setDateFilter('month')}
            >
              30 días
            </button>
          </div>
        </div>
      </div>

      {/* 4. Chronological Feed of Grouped Days */}
      <div className="history-feed-stack">
        {groupedByDate.length === 0 ? (
          <div className="history-empty-state glass-panel text-center py-5">
            <div className="empty-icon-wrap mb-2">
              <Clock size={36} className="text-secondary" />
            </div>
            <h3 className="empty-state-title">No hay registros que coincidan con los filtros</h3>
            <p className="empty-state-sub text-secondary">
              Probá restableciendo los términos de búsqueda o seleccionando otro rango temporal.
            </p>
            <button 
              type="button" 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setDateFilter('all'); }}
              className="btn-secondary mt-3"
            >
              Limpiar Filtros
            </button>
          </div>
        ) : (
          groupedByDate.map(([dateKey, items]) => {
            const dayCalories = items.reduce((acc, c) => acc + (Number(c.calories) || 0), 0);
            const dayProtein = items.reduce((acc, c) => acc + (Number(c.protein) || 0), 0);
            const dayCarbs = items.reduce((acc, c) => acc + (Number(c.carbs) || 0), 0);
            const dayFat = items.reduce((acc, c) => acc + (Number(c.fat) || 0), 0);
            const targetCal = targets?.targetCalories || 2000;
            const dayPct = Math.round((dayCalories / targetCal) * 100);

            return (
              <div key={dateKey} className="history-day-card glass-panel mb-4">
                {/* Day Header Summary Strip */}
                <div className="history-day-header">
                  <div className="d-flex align-center gap-3">
                    <div className="calendar-date-square">
                      <Calendar size={18} className="text-emerald" />
                    </div>
                    <div>
                      <div className="d-flex align-center gap-2">
                        <h3 className="day-heading-title">{formatDateHeading(dateKey)}</h3>
                        <span className="day-date-tag">{dateKey}</span>
                      </div>
                      <div className="day-macros-summary-row">
                        <span className="macro-sum-item">
                          Total: <strong>{formatNumber(dayCalories)} kcal</strong>
                        </span>
                        <span className="bullet-sep">•</span>
                        <span className="macro-sum-item text-emerald">P: {dayProtein}g</span>
                        <span className="bullet-sep">•</span>
                        <span className="macro-sum-item text-carbs">C: {dayCarbs}g</span>
                        <span className="bullet-sep">•</span>
                        <span className="macro-sum-item text-fat">G: {dayFat}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-header-right">
                    <span className={`day-adherence-pill ${dayPct >= 90 && dayPct <= 110 ? 'optimal' : dayPct > 110 ? 'surplus' : 'deficit'}`}>
                      {dayPct}% del objetivo
                    </span>
                  </div>
                </div>

                {/* Meals List for this Day */}
                <div className="history-day-items-list">
                  {items.map((item) => {
                    const catMeta = getCategoryMeta(item.category || 'breakfast');
                    const CatIcon = catMeta.icon;

                    return (
                      <div key={item.id} className="history-meal-item-card">
                        {/* Left: Thumbnail & Category Badge */}
                        <div className="meal-item-left">
                          <div className="meal-thumb-wrapper">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="meal-thumb-img" />
                            ) : (
                              <div className="meal-thumb-placeholder">
                                <CatIcon size={20} style={{ color: catMeta.color }} />
                              </div>
                            )}
                            <div 
                              className="cat-corner-badge"
                              style={{ backgroundColor: catMeta.color }}
                              title={catMeta.name}
                            >
                              <CatIcon size={12} color="#FFFFFF" />
                            </div>
                          </div>

                          <div className="meal-info-block">
                            <div className="d-flex align-center gap-2">
                              <h4 className="meal-item-title">{item.name}</h4>
                              <span className="meal-cat-label-pill" style={{ color: catMeta.color, borderColor: `${catMeta.color}35`, backgroundColor: `${catMeta.color}10` }}>
                                {catMeta.name}
                              </span>
                            </div>

                            <div className="meal-item-meta">
                              <span className="meta-time">
                                <Clock size={12} />
                                {item.time || '12:00'} hs
                              </span>
                              <span className="bullet-sep">•</span>
                              <span className="meta-portion">{item.portion || '1 porción'}</span>
                              {item.isFromAi && (
                                <>
                                  <span className="bullet-sep">•</span>
                                  <span className="ai-verified-tag">
                                    <Sparkles size={11} />
                                    Visión IA
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Center: Detailed Macronutrients Strip */}
                        <div className="meal-item-center">
                          <div className="macros-pills-row">
                            <div className="macro-pill-card protein">
                              <span className="mp-lbl">Proteína</span>
                              <span className="mp-val">{item.protein || 0}g</span>
                            </div>
                            <div className="macro-pill-card carbs">
                              <span className="mp-lbl">Carbos</span>
                              <span className="mp-val">{item.carbs || 0}g</span>
                            </div>
                            <div className="macro-pill-card fat">
                              <span className="mp-lbl">Grasas</span>
                              <span className="mp-val">{item.fat || 0}g</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Calories & Actions */}
                        <div className="meal-item-right">
                          <div className="meal-cals-box">
                            <span className="cals-number">{item.calories || 0}</span>
                            <span className="cals-unit">kcal</span>
                          </div>

                          <div className="meal-actions-group">
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicateFood?.(item);
                                showToast(`¡${item.name.slice(0, 24)}... añadido al diario de hoy!`);
                              }}
                              className="btn-meal-action duplicate"
                              title="Repetir esta comida en el diario de hoy"
                            >
                              <RotateCcw size={14} />
                              <span className="desktop-only">Repetir Hoy</span>
                            </button>

                            {onRemoveFood && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar registro de ${item.name}?`)) {
                                    onRemoveFood(item.id);
                                    showToast('Registro eliminado del historial');
                                  }
                                }}
                                className="btn-meal-action delete"
                                title="Eliminar registro"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
