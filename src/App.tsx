import React, { useState, useRef } from 'react';
import { RefreshCw, Smartphone, Hash, Shuffle, Sparkles, Zap, Copy, Check, ClipboardCheck } from 'lucide-react';

const BANGLADESHI_PREFIXES = ['013', '014', '015', '016', '017', '018', '019'];

const PREDEFINED_CODES = [
  'E57', 'KSS', '40D', '9NT', 'C25', '5DR', 'LRK', 'ONX', 'RMG', 'OC6',
  'NOT', '6VD', 'LL1', 'XH2', '5IR', 'I80', '0XF', 'D47', 'ZER', 'Z6H',
  'T8Z', 'BGC', 'I97', '7D1', 'JC1', '85E', 'MPD', 'QFS', 'RTN', '26B',
  'XJP', 'DVP', '65P', 'Z70', 'Y6V', '46M', 'A1S', 'L26', '7PQ', 'VCX',
  '2E3', '3BB', '46D', '3JS', 'QIV', 'VUY', 'VL2', 'R46', '74C', 'AL3',
  'OXW', 'DDC', 'ELF', 'WW2', 'OB6', 'H5H', '7I0', 'W90', 'A1K', 'K60',
  'TR2', '15Y', 'CZB', 'WR8', '69Z', '6GP', 'T8Q', '30M', '8EQ', 'OX6',
  '3V6', 'Y85', '4BB', '7AP', '32W', '9ME', 'MRG', '7F8', 'MZR', 'A4J',
  'W8M', 'L6B', 'JLQ', 'OIR', '4H9', 'XFO', 'LTY', 'TTE', '28M', '58C',
  'C30', 'TOG', 'SQ9', 'CIY', 'VSB', 'VNA', 'F3F', '6DN', 'VH5', 'WHK',
  'W34', 'IGR', 'CBJ', '7R3', '491', 'OZE', 'NIB', 'A6J', 'UVU', 'P76',
  '87C', 'OCG', 'O4K', 'WB2', 'MR3', 'NVA', 'IA3', 'DRI', 'P47', 'EU9',
  '2R8', 'RPJ', '69P', '37U', '0BD', '0B8', 'S6S', '3HQ', 'VL6', '47K',
  'UZL', 'UZH', '0EQ', 'UTL', '1PK', 'CL4', 'UUS', 'BCW', 'SN4', 'Z3U',
  '37S', 'R8O', '764', '75Z', 'LF5', 'FA4', 'F7S', 'ELH', 'ELD', 'K7D',
  'K7A', 'HS0'
];

interface GeneratedItem {
  type: 'mobile' | 'code';
  value: string;
  id: string;
}

function App() {
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [customPrefix, setCustomPrefix] = useState('');
  const [currentCodeIndex, setCurrentCodeIndex] = useState(0);
  const [copiedItems, setCopiedItems] = useState<{[key: string]: boolean}>({});
  const [generationMode, setGenerationMode] = useState<'sequential' | 'random'>('sequential');
  const [autoCopyEnabled, setAutoCopyEnabled] = useState(false);

  // Refs to track timeout IDs for copy operations
  const timeoutRefs = useRef<{[key: string]: NodeJS.Timeout}>({});

  const generateUniqueDigits = (count: number): string => {
    const digits = new Set<string>();
    while (digits.size < count) {
      digits.add(Math.floor(Math.random() * 10).toString());
    }
    return Array.from(digits).join('');
  };

  const generateRandomCode = (length: number = 3): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const copyToClipboard = async (text: string, itemKey: string, isAutomatic: boolean = false) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Clear any existing timeout for this item
      if (timeoutRefs.current[itemKey]) {
        clearTimeout(timeoutRefs.current[itemKey]);
      }
      
      setCopiedItems(prev => ({ ...prev, [itemKey]: true }));
      timeoutRefs.current[itemKey] = setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemKey]: false }));
        delete timeoutRefs.current[itemKey];
      }, isAutomatic ? 1500 : 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const generateAll = async () => {
    const newItems: GeneratedItem[] = [];
    
    // Generate 5 mobile numbers
    for (let i = 0; i < 5; i++) {
      const prefix = BANGLADESHI_PREFIXES[Math.floor(Math.random() * BANGLADESHI_PREFIXES.length)];
      const uniqueDigits = generateUniqueDigits(8);
      const newNumber = prefix + uniqueDigits;
      newItems.push({
        type: 'mobile',
        value: newNumber,
        id: `mobile-${Date.now()}-${i}`
      });
    }

    // Generate 5 codes if prefix is provided
    if (customPrefix.trim()) {
      const newCodes: string[] = [];
      
      if (generationMode === 'sequential') {
        for (let i = 0; i < 5; i++) {
          if (currentCodeIndex + i < PREDEFINED_CODES.length) {
            const code = customPrefix.trim() + PREDEFINED_CODES[currentCodeIndex + i];
            newCodes.push(code);
          }
        }
        setCurrentCodeIndex(prev => prev + newCodes.length);
      } else {
        // Random generation
        for (let i = 0; i < 5; i++) {
          const randomCode = generateRandomCode(3);
          const code = customPrefix.trim() + randomCode;
          newCodes.push(code);
        }
      }

      // Add codes to items
      newCodes.forEach((code, i) => {
        newItems.push({
          type: 'code',
          value: code,
          id: `code-${Date.now()}-${i}`
        });
      });
    }

    // Sort items to alternate: number, code, number, code, etc.
    const sortedItems: GeneratedItem[] = [];
    const mobileItems = newItems.filter(item => item.type === 'mobile');
    const codeItems = newItems.filter(item => item.type === 'code');
    
    const maxLength = Math.max(mobileItems.length, codeItems.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < mobileItems.length) {
        sortedItems.push(mobileItems[i]);
      }
      if (i < codeItems.length) {
        sortedItems.push(codeItems[i]);
      }
    }
    
    setGeneratedItems(sortedItems);
    
    // Auto-copy all items if enabled
    if (autoCopyEnabled && sortedItems.length > 0) {
      const allValues = sortedItems.map(item => item.value).join('\n');
      await copyToClipboard(allValues, 'all-items', true);
    }
  };

  const resetGenerator = () => {
    setCurrentCodeIndex(0);
    setGeneratedItems([]);
  };

  const canGenerate = generationMode === 'sequential' 
    ? (customPrefix.trim() && currentCodeIndex < PREDEFINED_CODES.length) || !customPrefix.trim()
    : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <div className={`w-2 h-2 rounded-full ${
              ['bg-white', 'bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200'][Math.floor(Math.random() * 5)]
            } opacity-60`}></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 p-2">
        <div className="max-w-4xl mx-auto pb-4">
          {/* Compact Header */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center justify-center p-2 bg-white/20 backdrop-blur-sm rounded-full mb-2">
              <Sparkles className="w-4 h-4 text-yellow-300 mr-1" />
              <Zap className="w-4 h-4 text-pink-300" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-lg">
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                FOS Tools
              </span>
            </h1>
            
            {/* Compact Auto-Copy Toggle */}
            <div className="mt-2 inline-flex items-center justify-center p-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <ClipboardCheck className={`w-4 h-4 mr-1 transition-colors duration-300 ${autoCopyEnabled ? 'text-green-300' : 'text-white/60'}`} />
              <span className="text-white font-bold text-xs mr-2">Auto-Copy</span>
              <button
                onClick={() => setAutoCopyEnabled(!autoCopyEnabled)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                  autoCopyEnabled ? 'bg-green-500' : 'bg-white/30'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                    autoCopyEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Single Generator Card */}
          <div className="bg-gradient-to-br from-emerald-400 via-purple-500 to-pink-600 rounded-xl p-3 shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500 hover:scale-105 backdrop-blur-sm mb-3">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-white/30 backdrop-blur-sm rounded-lg mr-2 shadow-lg">
                <Smartphone className="w-4 h-4 text-white drop-shadow-md" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white drop-shadow-md">📱🎲 Auto Generator</h2>
                <p className="text-white/90 text-xs font-medium">Generate numbers & codes together</p>
              </div>
              <div className="p-2 bg-white/30 backdrop-blur-sm rounded-lg ml-2 shadow-lg">
                <Hash className="w-4 h-4 text-white drop-shadow-md" />
              </div>
            </div>

            <div className="space-y-2">
              {/* Custom Prefix Input */}
              <div>
                <label htmlFor="prefix" className="block text-xs font-bold text-white mb-1 drop-shadow-md">
                  🏷️ Custom Prefix (Optional)
                </label>
                <input
                  type="text"
                  id="prefix"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="আমাকে trx দাও"
                  className="w-full px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-1 focus:ring-yellow-300 focus:border-yellow-300 transition-all duration-300 text-xs font-semibold bg-white/20 backdrop-blur-sm text-white placeholder-white/70 shadow-inner"
                />
              </div>

              {/* Generation Mode Toggle */}
              <div>
                <label className="block text-xs font-bold text-white mb-1 drop-shadow-md">
                  ⚙️ Code Mode
                </label>
                <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-0.5 border border-white/30">
                  <button
                    onClick={() => setGenerationMode('sequential')}
                    className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                      generationMode === 'sequential'
                        ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Hash className="w-3 h-3" />
                    Sequential
                  </button>
                  <button
                    onClick={() => setGenerationMode('random')}
                    className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                      generationMode === 'random'
                        ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Shuffle className="w-3 h-3" />
                    Random
                  </button>
                </div>
                
                {/* Code Usage Counter */}
                {generationMode === 'sequential' && customPrefix.trim() && (
                  <div className="mt-1 text-center">
                    <div className="inline-flex items-center justify-center px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <span className="text-white/90 text-xs font-medium">
                        📊 Used: {currentCodeIndex}/{PREDEFINED_CODES.length} codes
                      </span>
                      {currentCodeIndex >= PREDEFINED_CODES.length && (
                        <span className="ml-2 text-red-300 text-xs font-bold">⚠️ All Used!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={generateAll}
                disabled={!canGenerate}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/30 text-sm"
              >
                <RefreshCw className="w-3 h-3" />
                🚀 Generate All {generationMode === 'sequential' && customPrefix.trim() ? `(${Math.min(5, PREDEFINED_CODES.length - currentCodeIndex)} codes left)` : '(Numbers + Codes)'}
              </button>

              {generationMode === 'sequential' && customPrefix.trim() && (
                <button
                  onClick={resetGenerator}
                  className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-2 rounded-lg transition-all duration-300 text-xs backdrop-blur-sm border border-white/30 shadow-lg"
                >
                  🔄 Reset Code Generator
                </button>
              )}
            </div>
          </div>

          {/* Generated Items Display */}
          {generatedItems.length > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 shadow-2xl mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-sm">Generated Items</h3>
                {copiedItems['all-items'] && (
                  <span className="text-green-300 font-bold text-xs">✅ All Auto-Copied!</span>
                )}
              </div>
              
              <div className="space-y-1">
                {generatedItems.map((item, index) => (
                  <div key={item.id} className={`flex items-center justify-between rounded-md p-2 backdrop-blur-sm ${
                    item.type === 'mobile' 
                      ? 'bg-emerald-500/20 border border-emerald-300/30' 
                      : 'bg-purple-500/20 border border-purple-300/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      {item.type === 'mobile' ? (
                        <Smartphone className="w-3 h-3 text-emerald-300" />
                      ) : (
                        <Hash className="w-3 h-3 text-purple-300" />
                      )}
                      <div className="text-xs font-mono font-bold text-white drop-shadow-lg break-all">
                        {item.value}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.value, item.id)}
                      className={`inline-flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl transform hover:scale-105 text-sm flex-shrink-0 ml-2 ${
                        copiedItems[item.id]
                          ? 'bg-green-500/70 border-green-300/50 text-white'
                          : 'bg-white/30 hover:bg-white/50 border-white/40 text-white'
                      }`}
                    >
                      {copiedItems[item.id] ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="text-center text-white/80 text-xs font-medium mt-2">
                📊 Total: {generatedItems.filter(i => i.type === 'mobile').length} numbers, {generatedItems.filter(i => i.type === 'code').length} codes
                {generationMode === 'sequential' && customPrefix.trim() && (
                  <span className="block mt-1 text-yellow-300 font-bold">
                    🔢 Codes Used: {currentCodeIndex}/{PREDEFINED_CODES.length} 
                    ({PREDEFINED_CODES.length - currentCodeIndex} remaining)
                  </span>
                )}
              </div>
              
              {/* Copy All Button */}
              <div className="mt-3 pt-2 border-t border-white/20">
                <button
                  onClick={() => {
                    const allValues = generatedItems.map(item => item.value).join('\n');
                    copyToClipboard(allValues, 'manual-all-items');
                  }}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/30 text-sm"
                >
                  {copiedItems['manual-all-items'] ? (
                    <>
                      <Check className="w-4 h-4" />
                      ✅ All Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      📋 Copy All Items
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Compact Footer */}
          <div className="text-center mt-3">
            <div className="inline-flex items-center justify-center p-2 bg-white/20 backdrop-blur-sm rounded-full mb-1">
              <Sparkles className="w-4 h-4 text-yellow-300 mr-1 animate-spin" />
              <span className="text-white font-bold text-xs">Professional FOS Tools</span>
              <Sparkles className="w-4 h-4 text-pink-300 ml-1 animate-spin" />
            </div>
            <p className="text-white/80 text-xs font-medium">
              🌟 Crafted with love for number and code generation magic 🌟
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;