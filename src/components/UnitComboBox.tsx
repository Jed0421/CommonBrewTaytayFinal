import React, { useState, useRef, useEffect } from 'react';

export interface UnitOption {
  value: string;
  label: string;
  category: 'Weight / Solids' | 'Liquid / Volume' | 'Portions & Dispensing' | 'Packaging & Count';
  description: string;
}

export const UNIT_OPTIONS: UnitOption[] = [
  // Weight / Solids
  { value: 'g', label: 'Grams (g)', category: 'Weight / Solids', description: 'Powders, tea leaves, coffee beans' },
  { value: 'kg', label: 'Kilograms (kg)', category: 'Weight / Solids', description: 'Bulk beans, sugar bags' },
  { value: 'oz', label: 'Ounces (oz)', category: 'Weight / Solids', description: 'Dry weights & portions' },
  { value: 'lb', label: 'Pounds (lb)', category: 'Weight / Solids', description: 'Bulk wholesale packs' },

  // Liquid / Volume
  { value: 'ml', label: 'Milliliters (ml)', category: 'Liquid / Volume', description: 'Milk, syrups, espresso, purées' },
  { value: 'L', label: 'Liters (L)', category: 'Liquid / Volume', description: 'Dairy jugs, liquid concentrates' },
  { value: 'fl oz', label: 'Fluid Ounces (fl oz)', category: 'Liquid / Volume', description: 'Liquid volume measure' },

  // Portions & Dispensing
  { value: 'scoop', label: 'Scoop (scoop)', category: 'Portions & Dispensing', description: 'Boba pearls, powder scoop, toppings' },
  { value: 'shot', label: 'Shot (shot)', category: 'Portions & Dispensing', description: 'Espresso shots, flavor shots' },
  { value: 'pump', label: 'Pump (pump)', category: 'Portions & Dispensing', description: 'Syrup & sauce dispenser strokes' },
  { value: 'cup', label: 'Cup (cup)', category: 'Portions & Dispensing', description: 'Portioned cups, drink bases' },
  { value: 'slice', label: 'Slice (slice)', category: 'Portions & Dispensing', description: 'Cakes, cheesecakes, pastries' },
  { value: 'tbsp', label: 'Tablespoon (tbsp)', category: 'Portions & Dispensing', description: '~15ml culinary measure' },
  { value: 'tsp', label: 'Teaspoon (tsp)', category: 'Portions & Dispensing', description: '~5ml culinary measure' },

  // Packaging & Count
  { value: 'pcs', label: 'Pieces (pcs)', category: 'Packaging & Count', description: 'Cups, lids, straws, cookies, egg pies' },
  { value: 'pack', label: 'Pack (pack)', category: 'Packaging & Count', description: 'Straw packs, cup sleeves' },
  { value: 'bottle', label: 'Bottle (bottle)', category: 'Packaging & Count', description: 'Flavored syrups, dairy bottles' },
  { value: 'can', label: 'Can (can)', category: 'Packaging & Count', description: 'Condensed / evaporated milk' },
  { value: 'box', label: 'Box (box)', category: 'Packaging & Count', description: 'Bulk shipment boxes' },
  { value: 'roll', label: 'Roll (roll)', category: 'Packaging & Count', description: 'Sealing film, thermal receipt rolls' }
];

export const POPULAR_UNITS = ['g', 'ml', 'pcs', 'scoop', 'shot', 'pump', 'can', 'bottle'];

interface UnitComboBoxProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
}

export const UnitComboBox: React.FC<UnitComboBoxProps> = ({
  value,
  onChange,
  required = true,
  placeholder = 'Select or type unit...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on typed search
  const filteredOptions = UNIT_OPTIONS.filter(opt => {
    if (!value) return true;
    const v = value.toLowerCase().trim();
    return (
      opt.value.toLowerCase().includes(v) ||
      opt.label.toLowerCase().includes(v) ||
      opt.description.toLowerCase().includes(v) ||
      opt.category.toLowerCase().includes(v)
    );
  });

  const categories = Array.from(new Set(UNIT_OPTIONS.map(opt => opt.category)));

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input container with Chevron combo-box style */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%',
            paddingRight: '2.4rem',
            fontWeight: 700,
            color: 'var(--text)',
            fontSize: '0.9rem'
          }}
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Toggle Unit of Measure list"
          style={{
            position: 'absolute',
            right: '0.4rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.35rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-2)',
            borderRadius: '6px'
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{
              transition: 'transform 0.15s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Quick Select Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
        {POPULAR_UNITS.map(u => {
          const isSelected = value.toLowerCase() === u.toLowerCase();
          return (
            <button
              key={u}
              type="button"
              onClick={() => handleSelect(u)}
              style={{
                border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border)',
                background: isSelected ? 'var(--orange-bg)' : 'var(--bg)',
                color: isSelected ? 'var(--brand)' : 'var(--text-2)',
                fontSize: '0.72rem',
                fontWeight: isSelected ? 800 : 600,
                padding: '2px 7px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              {u}
            </button>
          );
        })}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            zIndex: 1100,
            padding: '0.4rem'
          }}
        >
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-2)' }}>
              No standard unit matching "<strong>{value}</strong>"
              <div style={{ marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  onClick={() => setIsOpen(false)}
                >
                  Keep custom "{value}"
                </button>
              </div>
            </div>
          ) : (
            categories.map(cat => {
              const catOptions = filteredOptions.filter(o => o.category === cat);
              if (catOptions.length === 0) return null;

              return (
                <div key={cat} style={{ marginBottom: '0.4rem' }}>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--brand)',
                      padding: '4px 8px',
                      background: 'var(--orange-bg)',
                      borderRadius: '6px',
                      marginBottom: '2px'
                    }}
                  >
                    {cat}
                  </div>

                  {catOptions.map(opt => {
                    const isSelected = value.toLowerCase() === opt.value.toLowerCase();
                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.6rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--orange-bg)' : 'transparent',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                minWidth: '38px',
                                textAlign: 'center',
                                background: isSelected ? 'var(--brand)' : 'var(--border)',
                                color: isSelected ? '#ffffff' : 'var(--text)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}
                            >
                              {opt.value}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                              {opt.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginLeft: '46px', marginTop: '1px' }}>
                            {opt.description}
                          </div>
                        </div>

                        {isSelected && (
                          <span style={{ color: 'var(--brand)', fontWeight: 800, fontSize: '0.85rem' }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
