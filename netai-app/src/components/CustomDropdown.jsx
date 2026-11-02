import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  triggerIcon: TriggerIcon,
  placeholder = 'Seleccionar...',
  className = '',
  menuAlign = 'left',
  width = 'auto',
  ariaLabel = 'Menú desplegable'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (optVal) => {
    onChange(optVal);
    setIsOpen(false);
  };

  const SelectedIcon = selectedOption?.icon;

  return (
    <div 
      className={`custom-dropdown-container ${className}`} 
      ref={containerRef}
      style={{ width: width === 'full' ? '100%' : 'auto' }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`custom-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <div className="trigger-left-content">
          {TriggerIcon && <TriggerIcon size={16} className="trigger-leading-icon text-emerald" />}
          {SelectedIcon && !TriggerIcon && (
            <SelectedIcon 
              size={16} 
              className="trigger-leading-icon" 
              style={{ color: selectedOption?.color || 'var(--brand-green)' }} 
            />
          )}
          <span className="trigger-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="trigger-right-content">
          {selectedOption?.badge && (
            <span className="trigger-badge-subtle">{selectedOption.badge}</span>
          )}
          <ChevronDown 
            size={15} 
            className={`trigger-chevron ${isOpen ? 'rotated' : ''}`} 
          />
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div 
          className={`custom-dropdown-menu glass-panel ${menuAlign === 'right' ? 'align-right' : 'align-left'}`}
          role="listbox"
        >
          <div className="dropdown-menu-list">
            {options.map((option) => {
              const isSelected = option.value === value;
              const OptionIcon = option.icon;

              return (
                <div
                  key={option.value}
                  className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                >
                  <div className="item-main-info">
                    {OptionIcon && (
                      <div 
                        className="item-icon-wrap"
                        style={{ 
                          backgroundColor: option.color ? `${option.color}15` : 'rgba(16, 185, 129, 0.12)',
                          color: option.color || 'var(--brand-green)'
                        }}
                      >
                        <OptionIcon size={15} />
                      </div>
                    )}
                    <div className="item-text-stack">
                      <span className="item-label-text">{option.label}</span>
                      {option.desc && (
                        <span className="item-desc-text">{option.desc}</span>
                      )}
                    </div>
                  </div>

                  <div className="item-meta-right">
                    {option.badge && (
                      <span className="item-badge">{option.badge}</span>
                    )}
                    {isSelected && (
                      <div className="item-check-icon">
                        <Check size={15} className="text-emerald" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
