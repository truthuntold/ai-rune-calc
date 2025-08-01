import React, { useState, useMemo, useEffect, useRef } from 'react';

// --- Data ---

/**
 * Generates a comprehensive map of short scale number abbreviations to their values.
 * This creates a systematic list and includes common aliases for compatibility.
 * @returns {Object} A map where keys are abbreviations (e.g., 'M', 'B', 'T') and values are their numeric equivalents, sorted by value.
 */
const generateScaleMap = () => {
  const scales = {
    '': 1, 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'Qd': 1e15, 'Qn': 1e18,
    'Sx': 1e21, 'Sp': 1e24, 'Oc': 1e27, 'No': 1e30,
  };

  const prefixes = ['', 'Un', 'Du', 'Tr', 'Qd', 'Qn', 'Sx', 'Sp', 'Oc', 'No'];
  const majorIllions = [
    { name: 'De', power: 33 },   // Decillion
    { name: 'Vg', power: 63 },   // Vigintillion
    { name: 'Tg', power: 93 },   // Trigintillion
    { name: 'qg', power: 123 },  // Quadragintillion
  ];

  for (const major of majorIllions) {
    for (let i = 0; i < prefixes.length; i++) {
      const key = prefixes[i] + major.name;
      const power = major.power + (i * 3);
      scales[key] = Math.pow(10, power);
    }
  }
  
  const aliases = {
    'QnTg': 1e99,  'SxVt': 1e81, 'TVt': 1e72, 'OcVt': 1e87, 'TTg': 1e102, 'QnVt': 1e78,
    // New Aliases from user data
    'NoTg': 1e120, // NovemTrigintillion
    'Dqg': 1e129,  // Duquadragintillion
    'Qdqg': 1e135, // Quattuorquadragintillion
  };
  Object.assign(scales, aliases);

  const sortedEntries = Object.entries(scales).sort(([, valA], [, valB]) => valA - valB);
  const sortedScales = {};
  for (const [key, value] of sortedEntries) {
      sortedScales[key] = value;
  }
  return sortedScales;
};

const scale = generateScaleMap();
const scaleEntries = Object.entries(scale).sort(([, a], [, b]) => b - a);

const runesData = [
  { name: 'Bloom', source: 'Color Rune', chance: 7.5e9 },
  { name: 'Aether', source: 'Polychrome Rune', chance: 1.5e10 },
  { name: 'Superstar', source: '5M Beginner', chance: 2.5e10 },
  { name: 'Vexed', source: 'Polychrome Rune', chance: 5e10 },
  { name: 'Blizzard', source: 'Arctic Rune', chance: 1e11 },
  { name: 'Kingslayer', source: '5M Royal', chance: 2.5e11 },
  { name: 'Mystery', source: 'Basic Rune', chance: 1e12 },
  { name: 'Thorn', source: 'Nature Rune', chance: 1e13 },
  { name: 'Divinity', source: '5M Royal', chance: 7.5e16 },
  { name: 'Abbysium', source: 'Polychrome Rune', chance: 1.25e17 },
  { name: 'Prosperity', source: '5M Royal', chance: 2.5e22 },
  { name: 'Oscillon', source: 'Polychrome Rune', chance: 3.33e27 },
  { name: 'Hyper Finality', source: 'Unspecified Source', chance: 7.5e32 },
  { name: 'Okay Garmin Save Video', source: 'Cryo Rune', chance: 1e42 },
  { name: 'Gleam', source: 'Color Rune', chance: 1e47 },
  { name: 'Shyft', source: 'Unspecified Source', chance: 7.5e55 },
  { name: 'Overlord', source: '5M Beginner', chance: 5e58 },
  { name: 'Mirror', source: 'Arctic Rune', chance: 7.5e60 },
  { name: 'Oblivion', source: 'Polychrome Rune', chance: 5e73 },
  { name: 'Immortality', source: '5M Royal', chance: 2e82 },
  { name: 'Vanta', source: 'Color Rune', chance: 5e87 },
  { name: 'Odyssey', source: '5M Royal', chance: 1.5e100 },
  { name: 'Frostbite', source: 'Arctic Rune', chance: 3e103 },
  { name: 'Destiny', source: '5M Royal', chance: 5e121 },
  { name: 'Squid', source: 'Nature Rune', chance: 1.5e130 },
  { name: 'Array', source: 'Unspecified Source', chance: 1e135 },
];

// --- Helper Functions ---
function formatTime(totalSeconds) {
  if (totalSeconds < 0 || !isFinite(totalSeconds)) return '...';
  if (totalSeconds < 1) return 'Instant';
  const units = [{ l: 'year', s: 31536000 }, { l: 'day', s: 86400 }, { l: 'hour', s: 3600 }, { l: 'minute', s: 60 }, { l: 'second', s: 1 }];
  let remaining = totalSeconds;
  const parts = [];
  for (const { l, s } of units) {
    if (remaining >= s) {
      const count = Math.floor(remaining / s);
      parts.push(`${count} ${l}${count > 1 ? 's' : ''}`);
      remaining %= s;
    }
  }
  return parts.slice(0, 3).join(', ');
}

function formatNumber(num) {
    for (const [suffix, value] of scaleEntries) {
        if (value > 0 && num >= value) {
            const scaledNum = (num / value).toPrecision(3);
            return `${parseFloat(scaledNum)} ${suffix}`;
        }
    }
    return num.toPrecision(3);
}

function formatChance(chance) {
    const scientific = `(${chance.toExponential(0)})`;
    return `1 / ${formatNumber(chance)} ${scientific}`;
}

// --- Custom Components ---
const FilterableDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setFilter('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => 
        Object.keys(scale).filter(s => s.toLowerCase().includes(filter.toLowerCase()))
    , [filter]);

    const handleSelect = (s) => {
        onChange(s);
        setIsOpen(false);
        setFilter('');
    };

    return (
        <div className="relative w-full sm:w-3/5" ref={dropdownRef}>
            <input type="text" value={isOpen ? filter : `${value} (${scale[value].toExponential(0)})`} onFocus={() => setIsOpen(true)} onChange={(e) => setFilter(e.target.value)} placeholder="Search scale..." className="w-full bg-gray-700 text-white text-lg p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 transition text-center" />
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border-2 border-gray-600 rounded-b-lg mt-1 max-h-60 overflow-y-auto z-20">
                    {filteredOptions.map(s => (
                        <div key={s} onClick={() => handleSelect(s)} className="p-3 text-white hover:bg-cyan-600 cursor-pointer transition">
                            {s === '' ? 'None' : s} ({scale[s].toExponential(0)})
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TargetCalculator = () => {
    const [targetRuneName, setTargetRuneName] = useState(runesData[0].name);
    const [targetTime, setTargetTime] = useState('30');
    const [targetTimeUnit, setTargetTimeUnit] = useState('60'); // minutes

    const requiredRps = useMemo(() => {
        const rune = runesData.find(r => r.name === targetRuneName);
        if (!rune) return 0;
        const timeInSeconds = parseFloat(targetTime) * parseFloat(targetTimeUnit);
        if (timeInSeconds <= 0) return Infinity;
        return rune.chance / timeInSeconds;
    }, [targetRuneName, targetTime, targetTimeUnit]);

    return (
        <div className="p-1">
            <h2 className="text-2xl text-center font-bold text-cyan-400 mb-4">"What If?" Target Calculator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select value={targetRuneName} onChange={e => setTargetRuneName(e.target.value)} className="bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500">
                    {runesData.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
                <input type="number" value={targetTime} onChange={e => setTargetTime(e.target.value)} className="bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="Time" />
                <select value={targetTimeUnit} onChange={e => setTargetTimeUnit(e.target.value)} className="bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500">
                    <option value="60">Minutes</option>
                    <option value="3600">Hours</option>
                    <option value="86400">Days</option>
                </select>
            </div>
            <div className="text-center bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-400">To get this rune in the specified time, you need:</p>
                <p className="text-2xl font-bold text-cyan-300 mt-1">{formatNumber(requiredRps)} RPS</p>
            </div>
        </div>
    );
};


// --- Main Application Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' or 'whatif'
  const [rateValue, setRateValue] = useState('1');
  const [rateScale, setRateScale] = useState('M');
  const [hideInstant, setHideInstant] = useState(true);
  const [sortOrder, setSortOrder] = useState('asc');
  const [runeFilter, setRuneFilter] = useState('');

  // Load state from localStorage on initial render
  useEffect(() => {
    const savedRateValue = localStorage.getItem('runeCalc_rateValue');
    const savedRateScale = localStorage.getItem('runeCalc_rateScale');
    if (savedRateValue) setRateValue(savedRateValue);
    if (savedRateScale) setRateScale(savedRateScale);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('runeCalc_rateValue', rateValue);
    localStorage.setItem('runeCalc_rateScale', rateScale);
  }, [rateValue, rateScale]);

  const rps = useMemo(() => {
    const num = parseFloat(rateValue) || 0;
    const multiplier = scale[rateScale] || 1;
    return num * multiplier;
  }, [rateValue, rateScale]);

  const { processedRunes, nextUpgradeName } = useMemo(() => {
    let nextUpgrade = null;
    const filtered = runesData
      .map(rune => ({
        ...rune,
        time: rps > 0 ? rune.chance / rps : Infinity,
      }))
      .filter(rune => {
          const matchesFilter = rune.name.toLowerCase().includes(runeFilter.toLowerCase()) || rune.source.toLowerCase().includes(runeFilter.toLowerCase());
          const isInstant = rune.time < 1;
          return matchesFilter && (!hideInstant || !isInstant);
      })
      .sort((a, b) => sortOrder === 'asc' ? a.chance - b.chance : b.chance - a.chance);
    
    if (sortOrder === 'asc') {
        nextUpgrade = filtered.find(r => r.time >= 1 && r.time < 3600) || null;
    }
      
    return { processedRunes: filtered, nextUpgradeName: nextUpgrade?.name };
  }, [rps, hideInstant, sortOrder, runeFilter]);

  const TabButton = ({ tabName, label }) => {
    const isActive = activeTab === tabName;
    return (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-colors duration-300 ${
                isActive 
                ? 'bg-gray-800 text-cyan-400' 
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 mb-2">Rune Time Calculator</h1>
          <p className="text-lg text-gray-400">A strategic tool for planning your progression.</p>
        </header>

        <div className="flex border-b border-gray-700 mb-0">
            <TabButton tabName="calculator" label="Rune Calculator" />
            <TabButton tabName="whatif" label="Target 'What If?'" />
        </div>
        
        <div className="bg-gray-800 p-6 rounded-b-xl shadow-lg">
            {activeTab === 'calculator' && (
                <div>
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-4 sticky top-4 z-10">
                        <h3 className="text-xl font-bold text-center text-white mb-4">My Current Rate</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <input type="number" value={rateValue} onChange={(e) => setRateValue(e.target.value)} className="w-full sm:w-2/5 bg-gray-700 text-white text-lg p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 1.5" />
                            <FilterableDropdown value={rateScale} onChange={setRateScale} />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 mb-6 bg-gray-800/50 rounded-lg">
                        <input type="text" value={runeFilter} onChange={e => setRuneFilter(e.target.value)} placeholder="Filter runes by name..." className="w-full sm:w-auto bg-gray-700 text-white p-2 rounded-lg border-2 border-gray-600 focus:border-cyan-500" />
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="hide-instant" checked={hideInstant} onChange={(e) => setHideInstant(e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-500 text-cyan-500 focus:ring-cyan-600" />
                            <label htmlFor="hide-instant" className="text-white">Hide Instant</label>
                        </div>
                        <select id="sort-order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-gray-700 text-white p-2 rounded-lg border-2 border-gray-600 focus:border-cyan-500">
                            <option value="asc">Easiest First</option>
                            <option value="desc">Hardest First</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {processedRunes.map((rune) => {
                            const isNextUpgrade = rune.name === nextUpgradeName;
                            const highlightClass = isNextUpgrade ? 'border-yellow-400 shadow-yellow-400/20 shadow-lg' : 'border-gray-700';

                            return (
                            <div key={rune.name} className={`bg-gray-900/50 backdrop-blur-sm p-5 rounded-lg shadow-md border transition-all duration-300 ${highlightClass}`}>
                                {isNextUpgrade && <div className="text-yellow-400 font-bold mb-2 text-sm">NEXT REASONABLE UPGRADE (&lt;1 hour)</div>}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div className="mb-3 sm:mb-0">
                                    <h2 className="text-2xl font-bold text-white">{rune.name}</h2>
                                    <p className="text-sm text-gray-400">{rune.source}</p>
                                    <p className="text-sm text-cyan-400">{formatChance(rune.chance)}</p>
                                </div>
                                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-lg font-semibold px-4 py-2 rounded-lg text-center w-full sm:w-auto min-w-[150px]">
                                    {formatTime(rune.time)}
                                </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {activeTab === 'whatif' && (
                <TargetCalculator />
            )}
        </div>
        
        <footer className="text-center mt-12 text-gray-500">
            <p>Calculator based on user-provided data.</p>
        </footer>
      </div>
    </div>
  );
}
