import React from 'react';
import { Palette, RotateCcw } from 'lucide-react';

export interface ColorScheme {
  keywords: string;
  operators: string;
  strings: string;
  numbers: string;
  comments: string;
  classes: string;
  functions: string;
  background: string;
  text: string;
  lineNumbers: string;
  cursor: string;
}

interface ColorCustomizerProps {
  colorScheme: ColorScheme;
  onColorChange: (colorScheme: ColorScheme) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const defaultColorScheme: ColorScheme = {
  keywords: '#FF6B9D',
  operators: '#4ECDC4',
  strings: '#95E1D3',
  numbers: '#FFE66D',
  comments: '#A8A8A8',
  classes: '#FF8C42',
  functions: '#6BCF7F',
  background: '#0A0A0A',
  text: '#FFFFFF',
  lineNumbers: '#4ECDC4',
  cursor: '#FF6B9D'
};

const presetThemes = {
  'Cyberpunk': {
    keywords: '#FF6B9D',
    operators: '#4ECDC4',
    strings: '#95E1D3',
    numbers: '#FFE66D',
    comments: '#A8A8A8',
    classes: '#FF8C42',
    functions: '#6BCF7F',
    background: '#0A0A0A',
    text: '#FFFFFF',
    lineNumbers: '#4ECDC4',
    cursor: '#FF6B9D'
  },
  'Ocean': {
    keywords: '#61DAFB',
    operators: '#82AAFF',
    strings: '#C3E88D',
    numbers: '#F78C6C',
    comments: '#546E7A',
    classes: '#FFCB6B',
    functions: '#89DDFF',
    background: '#0F1419',
    text: '#FFFFFF',
    lineNumbers: '#82AAFF',
    cursor: '#61DAFB'
  },
  'Sunset': {
    keywords: '#FF5370',
    operators: '#F07178',
    strings: '#C3E88D',
    numbers: '#F78C6C',
    comments: '#697098',
    classes: '#FFCB6B',
    functions: '#82AAFF',
    background: '#1A1A2E',
    text: '#EEFFFF',
    lineNumbers: '#F07178',
    cursor: '#FF5370'
  },
  'Forest': {
    keywords: '#98C379',
    operators: '#56B6C2',
    strings: '#E06C75',
    numbers: '#D19A66',
    comments: '#5C6370',
    classes: '#E5C07B',
    functions: '#61AFEF',
    background: '#1E2127',
    text: '#ABB2BF',
    lineNumbers: '#56B6C2',
    cursor: '#98C379'
  }
};

const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  colorScheme,
  onColorChange,
  isOpen,
  onToggle
}) => {
  const handleColorChange = (key: keyof ColorScheme, value: string) => {
    onColorChange({
      ...colorScheme,
      [key]: value
    });
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = presetThemes[presetName as keyof typeof presetThemes];
    if (preset) {
      onColorChange(preset);
    }
  };

  const handleReset = () => {
    onColorChange(defaultColorScheme);
  };

  const colorOptions = [
    { key: 'keywords' as keyof ColorScheme, label: 'Keywords', description: 'function, const, if, etc.' },
    { key: 'operators' as keyof ColorScheme, label: 'Operators', description: '=, +, -, &&, ||, etc.' },
    { key: 'strings' as keyof ColorScheme, label: 'Strings', description: '"text", \'text\'' },
    { key: 'numbers' as keyof ColorScheme, label: 'Numbers', description: '123, 45.67' },
    { key: 'comments' as keyof ColorScheme, label: 'Comments', description: '// comment, /* comment */' },
    { key: 'classes' as keyof ColorScheme, label: 'Classes/Types', description: 'MyClass, UserType' },
    { key: 'functions' as keyof ColorScheme, label: 'Functions', description: 'myFunction()' },
    { key: 'lineNumbers' as keyof ColorScheme, label: 'Line Numbers', description: '1, 2, 3...' },
    { key: 'cursor' as keyof ColorScheme, label: 'Cursor', description: 'Blinking cursor' },
    { key: 'text' as keyof ColorScheme, label: 'Default Text', description: 'Regular code text' },
    { key: 'background' as keyof ColorScheme, label: 'Background', description: 'Video background' }
  ];

  return (
    <div className="bg-black border-2 border-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-white rounded-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Color Customizer</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-white hover:bg-white hover:text-black p-2 rounded border-2 border-white transition-colors"
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6">
          {/* Preset Themes */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Preset Themes</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(presetThemes).map(themeName => (
                <button
                  key={themeName}
                  onClick={() => handlePresetSelect(themeName)}
                  className="bg-black border-2 border-white text-white hover:bg-white hover:text-black 
                           px-4 py-2 rounded font-bold transition-colors text-sm"
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-white">Custom Colors</h4>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 bg-black border-2 border-white text-white 
                         hover:bg-white hover:text-black px-3 py-1 rounded font-bold transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {colorOptions.map(({ key, label, description }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-white font-bold text-sm mb-1">
                      {label}
                    </label>
                    <p className="text-gray-400 text-xs">{description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded border-2 border-white"
                      style={{ backgroundColor: colorScheme[key] }}
                    />
                    <input
                      type="color"
                      value={colorScheme[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-12 h-8 rounded border-2 border-white cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorScheme[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-20 px-2 py-1 bg-black border-2 border-white text-white rounded text-sm font-mono"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Preview</h4>
            <div 
              className="p-4 rounded border-2 border-white font-mono text-sm"
              style={{ backgroundColor: colorScheme.background }}
            >
              <div className="flex">
                <span style={{ color: colorScheme.lineNumbers }} className="w-8 text-right pr-2">1</span>
                <span style={{ color: colorScheme.keywords }}>function</span>
                <span style={{ color: colorScheme.text }}> </span>
                <span style={{ color: colorScheme.functions }}>hello</span>
                <span style={{ color: colorScheme.operators }}>(</span>
                <span style={{ color: colorScheme.text }}>name</span>
                <span style={{ color: colorScheme.operators }}>)</span>
                <span style={{ color: colorScheme.text }}> </span>
                <span style={{ color: colorScheme.operators }}>{"{"}</span>
              </div>
              <div className="flex">
                <span style={{ color: colorScheme.lineNumbers }} className="w-8 text-right pr-2">2</span>
                <span style={{ color: colorScheme.text }}>  </span>
                <span style={{ color: colorScheme.keywords }}>const</span>
                <span style={{ color: colorScheme.text }}> message </span>
                <span style={{ color: colorScheme.operators }}>=</span>
                <span style={{ color: colorScheme.text }}> </span>
                <span style={{ color: colorScheme.strings }}>"Hello "</span>
                <span style={{ color: colorScheme.text }}> </span>
                <span style={{ color: colorScheme.operators }}>+</span>
                <span style={{ color: colorScheme.text }}> name</span>
                <span style={{ color: colorScheme.operators }}>;</span>
              </div>
              <div className="flex">
                <span style={{ color: colorScheme.lineNumbers }} className="w-8 text-right pr-2">3</span>
                <span style={{ color: colorScheme.text }}>  </span>
                <span style={{ color: colorScheme.comments }}>// Display the message</span>
              </div>
              <div className="flex">
                <span style={{ color: colorScheme.lineNumbers }} className="w-8 text-right pr-2">4</span>
                <span style={{ color: colorScheme.text }}>  console.</span>
                <span style={{ color: colorScheme.functions }}>log</span>
                <span style={{ color: colorScheme.operators }}>(</span>
                <span style={{ color: colorScheme.text }}>message</span>
                <span style={{ color: colorScheme.operators }}>);</span>
              </div>
              <div className="flex">
                <span style={{ color: colorScheme.lineNumbers }} className="w-8 text-right pr-2">5</span>
                <span style={{ color: colorScheme.operators }}>{"}"}</span>
                <span 
                  style={{ backgroundColor: colorScheme.cursor }} 
                  className="inline-block w-1 h-4 ml-1 animate-pulse"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorCustomizer;