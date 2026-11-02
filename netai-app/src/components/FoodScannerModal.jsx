import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  Plus, 
  Scan, 
  RefreshCw, 
  AlertTriangle,
  Flame,
  Layers,
  ChevronRight,
  Info,
  Crown,
  Edit2
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { PRESET_SAMPLE_FOODS } from '../nutritionEngine';

export default function FoodScannerModal({ 
  isOpen, 
  onClose, 
  onAddFood, 
  photoCredits = 3, 
  plan = 'free',
  onOpenPremium
}) {
  const { t, formatNumber } = useTranslation();

  const [activeTab, setActiveTab] = useState('liveCamera'); // 'liveCamera' | 'upload' | 'text' | 'presets'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [textDescription, setTextDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields for precision refinement
  const [editForm, setEditForm] = useState({
    foodName: '',
    portion: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Synchronize camera lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'liveCamera' && !capturedImage && photoCredits > 0) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, capturedImage, photoCredits]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } else {
        setCameraError('Tu dispositivo o navegador no admite acceso directo a la cámara.');
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Permiso de cámara no concedido. Puedes subir una imagen desde tu galería o usar los platos de prueba.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = () => {
    if (photoCredits <= 0) return;

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      stopCamera();
      setCapturedImage(dataUrl);
      analyzeMeal(dataUrl, 'image');
    }
  };

  const handleImageUpload = (e) => {
    if (photoCredits <= 0) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result);
        analyzeMeal(reader.result, 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulatedCapture = (preset) => {
    if (photoCredits <= 0) return;
    stopCamera();
    setCapturedImage(preset.image);
    analyzeMeal(preset, 'preset');
  };

  const analyzeMeal = (data, type) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsEditing(false);

    setTimeout(() => {
      setIsAnalyzing(false);
      let res = null;

      if (type === 'preset') {
        res = {
          foodName: data.name,
          portion: '1 porción estándar (~320g)',
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          confidence: '98%',
          ingredients: ['Alimento verificado', 'Ingredientes naturales identificados']
        };
      } else if (type === 'text') {
        const query = textDescription.toLowerCase();
        let cals = 360;
        let p = 28;
        let c = 32;
        let f = 12;

        if (query.includes('huevo') || query.includes('huevos')) {
          cals = 320; p = 22; c = 18; f = 16;
        } else if (query.includes('pollo') || query.includes('pechuga')) {
          cals = 390; p = 44; c = 24; f = 8;
        } else if (query.includes('ensalada')) {
          cals = 250; p = 14; c = 16; f = 15;
        } else if (query.includes('carne') || query.includes('bife') || query.includes('hamburguesa')) {
          cals = 540; p = 40; c = 20; f = 29;
        } else if (query.includes('pizza') || query.includes('pasta')) {
          cals = 640; p = 22; c = 78; f = 24;
        }

        res = {
          foodName: textDescription || 'Plato analizado por lenguaje natural',
          portion: '1 plato estimado',
          calories: cals,
          protein: p,
          carbs: c,
          fat: f,
          confidence: '95%',
          ingredients: ['Análisis semántico del plato', 'Distribución nutricional estimada']
        };
      } else {
        // Captured from Camera or Upload
        res = {
          foodName: 'Bowl Saludable Identificado',
          portion: '1 porción (~340g)',
          calories: 420,
          protein: 36,
          carbs: 32,
          fat: 14,
          confidence: '96%',
          ingredients: ['Proteína magra detectada', 'Acompañamiento vegetal', 'Grasa saludable']
        };
      }

      setAnalysisResult(res);
      setEditForm({
        foodName: res.foodName,
        portion: res.portion,
        calories: res.calories,
        protein: res.protein,
        carbs: res.carbs,
        fat: res.fat
      });
    }, 1200);
  };

  const handleSaveToDiary = () => {
    if (analysisResult) {
      onAddFood({
        id: Date.now(),
        name: isEditing ? editForm.foodName : analysisResult.foodName,
        calories: Number(isEditing ? editForm.calories : analysisResult.calories),
        protein: Number(isEditing ? editForm.protein : analysisResult.protein),
        carbs: Number(isEditing ? editForm.carbs : analysisResult.carbs),
        fat: Number(isEditing ? editForm.fat : analysisResult.fat),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        image: capturedImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        isFromAi: true
      });
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setAnalysisResult(null);
    setTextDescription('');
    setCameraError(null);
    setIsEditing(false);
    onClose();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsEditing(false);
    if (activeTab === 'liveCamera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={handleClose}>
      <div className="scanner-modal-card glass-panel" onClick={e => e.stopPropagation()}>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Modal Top Bar */}
        <div className="scanner-top-bar">
          <div className="scanner-title-group">
            <div className="scanner-badge-icon">
              <Camera size={20} className="text-emerald" />
            </div>
            <div>
              <h3 className="scanner-heading">{t('scanner.title')}</h3>
              <p className="scanner-subheading">
                {t('scanner.subtitle')}
              </p>
            </div>
          </div>

          <div className="d-flex align-center gap-2">
            {/* Photo Quota Badge */}
            <div className={`quota-pill ${photoCredits === 0 ? 'empty' : ''}`}>
              <Sparkles size={14} />
              <span>{t('scanner.quota', { count: photoCredits })}</span>
            </div>

            <button type="button" onClick={handleClose} className="modal-close-btn" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Limit Reached Warning Banner */}
        {photoCredits <= 0 ? (
          <div className="limit-reached-banner">
            <div className="limit-icon-wrap">
              <Crown size={28} className="text-amber" />
            </div>
            <h4>{t('scanner.limitTitle')}</h4>
            <p>{t('scanner.limitMsg')}</p>
            <button 
              type="button" 
              className="btn-primary mt-3"
              onClick={() => {
                handleClose();
                onOpenPremium();
              }}
            >
              <Crown size={16} />
              <span>{t('scanner.upgradeCta')}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Input Method Segmented Tabs */}
            {!capturedImage && (
              <div className="scanner-nav-tabs">
                <button 
                  type="button" 
                  className={`scan-tab-btn ${activeTab === 'liveCamera' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('liveCamera'); }}
                >
                  <Camera size={16} />
                  <span>{t('scanner.camera')}</span>
                </button>
                <button 
                  type="button" 
                  className={`scan-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('upload'); }}
                >
                  <Upload size={16} />
                  <span>{t('scanner.gallery')}</span>
                </button>
                <button 
                  type="button" 
                  className={`scan-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('presets'); }}
                >
                  <Scan size={16} />
                  <span>{t('scanner.presets')}</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT: LIVE CAMERA */}
            {activeTab === 'liveCamera' && !capturedImage && (
              <div className="camera-viewfinder-wrap">
                {cameraError ? (
                  <div className="camera-error-box">
                    <AlertTriangle size={32} className="text-amber mb-2" />
                    <p>{cameraError}</p>
                    <label className="btn-secondary mt-3 cursor-pointer">
                      <Upload size={16} />
                      <span>{t('scanner.gallery')}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                ) : (
                  <div className="viewfinder-feed">
                    <video ref={videoRef} playsInline autoPlay muted className="viewfinder-video" />
                    
                    {/* Minimal Framing Reticle */}
                    <div className="viewfinder-overlay">
                      <div className="reticle-box">
                        <div className="reticle-corner top-left" />
                        <div className="reticle-corner top-right" />
                        <div className="reticle-corner bottom-left" />
                        <div className="reticle-corner bottom-right" />
                        <span className="reticle-hint">Enfoca tu comida en el centro</span>
                      </div>
                    </div>

                    {/* Shutter Button */}
                    <div className="viewfinder-controls">
                      <button 
                        type="button" 
                        onClick={capturePhotoFromCamera} 
                        className="shutter-button"
                        aria-label={t('scanner.takePhoto')}
                      >
                        <div className="shutter-inner" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: UPLOAD FROM GALLERY */}
            {activeTab === 'upload' && !capturedImage && (
              <div className="upload-dropzone-wrap">
                <label className="upload-dropzone">
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <div className="dropzone-content">
                    <div className="dropzone-icon">
                      <Upload size={32} className="text-emerald" />
                    </div>
                    <h4>Selecciona una fotografía de tu comida</h4>
                    <p>Formatos admitidos: JPG, PNG, WebP o capturas</p>
                    <span className="btn-secondary mt-2">Buscar en Fotos</span>
                  </div>
                </label>
              </div>
            )}

            {/* TAB CONTENT: PRESET DEMO PLATES */}
            {activeTab === 'presets' && !capturedImage && (
              <div className="presets-list-wrap">
                <p className="presets-intro">Toca cualquier plato preparado para probar el motor de visión:</p>
                <div className="presets-cards-grid">
                  {PRESET_SAMPLE_FOODS.map((food, idx) => (
                    <div 
                      key={idx} 
                      className="preset-card-item"
                      onClick={() => handleSimulatedCapture(food)}
                    >
                      <img src={food.image} alt={food.name} className="preset-thumb" />
                      <div className="preset-meta">
                        <span className="preset-title">{food.name}</span>
                        <span className="preset-kcal">{food.calories} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAPTURED PREVIEW WITH SCANNING OVERLAY */}
            {capturedImage && (
              <div className="captured-preview-container">
                <div className="captured-image-box">
                  <img src={capturedImage} alt="Foto analizada" className="captured-render" />
                  
                  {isAnalyzing && (
                    <div className="analyzing-backdrop">
                      <div className="laser-scan-line" />
                      <div className="analyzing-pill">
                        <Sparkles size={16} className="text-emerald animate-spin" />
                        <span>{t('scanner.analyzing')}</span>
                      </div>
                    </div>
                  )}

                  {!isAnalyzing && (
                    <button type="button" onClick={handleRetake} className="btn-retake-floating">
                      <RefreshCw size={14} />
                      <span>Volver a tomar</span>
                    </button>
                  )}
                </div>

                {/* NUTRITIONAL BREAKDOWN & EDITING */}
                {analysisResult && !isAnalyzing && (
                  <div className="result-breakdown-card fade-in">
                    {/* Disclaimer Header */}
                    <div className="disclaimer-chip">
                      <Info size={14} className="text-secondary shrink-0" />
                      <span>{t('scanner.disclaimer')}</span>
                    </div>

                    <div className="result-header-row">
                      {isEditing ? (
                        <div className="w-100">
                          <label className="input-field-label">{t('meals.foodName')}:</label>
                          <input 
                            type="text" 
                            className="input-text-edit"
                            value={editForm.foodName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, foodName: e.target.value }))}
                          />
                          <label className="input-field-label mt-2">{t('meals.portion')}:</label>
                          <input 
                            type="text" 
                            className="input-text-edit"
                            value={editForm.portion}
                            onChange={(e) => setEditForm(prev => ({ ...prev, portion: e.target.value }))}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="d-flex align-center gap-2">
                            <h3 className="result-name">{editForm.foodName}</h3>
                            <button 
                              type="button" 
                              onClick={() => setIsEditing(true)} 
                              className="btn-edit-trigger"
                              title={t('meals.edit')}
                            >
                              <Edit2 size={14} />
                              <span>{t('meals.edit')}</span>
                            </button>
                          </div>
                          <span className="result-portion">{editForm.portion}</span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="result-calories-tag">
                          <Flame size={20} className="text-emerald" />
                          <div>
                            <span className="cal-number">{editForm.calories}</span>
                            <span className="cal-label">kcal</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Macro Cards / Edit Inputs */}
                    {isEditing ? (
                      <div className="edit-macros-grid mt-3">
                        <div className="edit-macro-col">
                          <label className="macro-col-lbl">{t('meals.caloriesLabel')}</label>
                          <input 
                            type="number" 
                            className="input-macro-num" 
                            value={editForm.calories}
                            onChange={(e) => setEditForm(prev => ({ ...prev, calories: e.target.value }))}
                          />
                        </div>
                        <div className="edit-macro-col">
                          <label className="macro-col-lbl">{t('meals.proteinLabel')}</label>
                          <input 
                            type="number" 
                            className="input-macro-num" 
                            value={editForm.protein}
                            onChange={(e) => setEditForm(prev => ({ ...prev, protein: e.target.value }))}
                          />
                        </div>
                        <div className="edit-macro-col">
                          <label className="macro-col-lbl">{t('meals.carbsLabel')}</label>
                          <input 
                            type="number" 
                            className="input-macro-num" 
                            value={editForm.carbs}
                            onChange={(e) => setEditForm(prev => ({ ...prev, carbs: e.target.value }))}
                          />
                        </div>
                        <div className="edit-macro-col">
                          <label className="macro-col-lbl">{t('meals.fatLabel')}</label>
                          <input 
                            type="number" 
                            className="input-macro-num" 
                            value={editForm.fat}
                            onChange={(e) => setEditForm(prev => ({ ...prev, fat: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="macro-indicators-row">
                        <div className="macro-chip protein">
                          <span className="chip-name">{t('macros.protein')}</span>
                          <span className="chip-val">{editForm.protein}g</span>
                        </div>
                        <div className="macro-chip carbs">
                          <span className="chip-name">{t('macros.carbs')}</span>
                          <span className="chip-val">{editForm.carbs}g</span>
                        </div>
                        <div className="macro-chip fat">
                          <span className="chip-name">{t('macros.fat')}</span>
                          <span className="chip-val">{editForm.fat}g</span>
                        </div>
                      </div>
                    )}

                    {/* Confirm Button */}
                    <div className="result-action-bar">
                      <button 
                        type="button" 
                        onClick={handleSaveToDiary}
                        className="btn-primary w-100"
                      >
                        <Check size={18} />
                        <span>{t('meals.save')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
