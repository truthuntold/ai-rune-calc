import React, { useState, useMemo, useEffect, useRef } from 'react';

// --- App Info & Data ---
const version = '1.0.5';

const changelog = [
    { version: '1.0.5', date: '2025-08-02', changes: ['Added case-sensitive handling for ambiguous number suffixes (e.g., Tqg vs TQg) with a user warning.'] },
    { version: '1.0.4', date: '2025-08-01', changes: ['Updated the sources for Hyper Finality, Shyft, Array, and Stray runes.'] },
    { version: '1.0.3', date: '2025-08-01', changes: ['Added the Stray rune.'] },
    { version: '1.0.2', date: '2025-08-01', changes: ['Added a clarifying line to note that times are for a single rune.'] },
    { version: '1.0.1', date: '2025-08-01', changes: ['Corrected the chance for the Vanta rune.'] },
    { version: '1.0.0', date: '2025-08-01', changes: ['Added versioning and a changelog.', 'Improved styling for rune descriptions.', 'Added a message to report incorrect values.', 'Made RPS input parsing case-insensitive.'] },
    { version: '0.9.0', date: '2025-07-31', changes: ['Added rune stat descriptions to each entry.', 'Updated rune data and number scaling to the latest values.'] },
    { version: '0.8.0', date: '2025-07-30', changes: ['Refactored the UI to use a tabbed interface.', 'Set "Hide Instant Runes" to be on by default.'] },
    { version: '0.7.0', date: '2025-07-29', changes: ['Added a "What If?" Target Calculator.', 'Added a "Next Upgrade" highlight.', 'RPS input is now saved to local storage.', 'Added a text filter for the rune list.'] },
    { version: '0.6.0', date: '2025-07-28', changes: ['Added scientific notation to all values.', 'Added sorting options.', 'Added a checkbox to hide instant runes.', 'The RPS scale dropdown is now a searchable input.'] },
    { version: '0.5.0', date: '2025-07-27', changes: ['Initial public version of the Rune Calculator.'] },
];


/**
 * Generates a comprehensive map of short scale number abbreviations to their values
 * based on the user-provided list.
 * @returns {Object} A map where keys are abbreviations and values are their numeric equivalents.
 */
const generateScaleMap = () => {
  const scales = {
    '': 1,
    // Standard names up to Decillion
    'Thousand': 1e3, 'Million': 1e6, 'Billion': 1e9, 'Trillion': 1e12, 'Quadrillion': 1e15, 
    'Quintillion': 1e18, 'Sextillion': 1e21, 'Septillion': 1e24, 'Octillion': 1e27, 'Nonillion': 1e30, 
    'Decillion': 1e33,
    // User provided short names
    'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'Qd': 1e15, 'Qn': 1e18, 'Sx': 1e21, 'Sp': 1e24, 
    'Oc': 1e27, 'No': 1e30, 'De': 1e33,
    'UDe': 1e36, 'DDe': 1e39, 'TDe': 1e42, 'QdDe': 1e45, 'QnDe': 1e48, 'SxDe': 1e51, 'SpDe': 1e54, 
    'OcDe': 1e57, 'NoDe': 1e60, 'Vt': 1e63,
    'UVt': 1e66, 'DVt': 1e69, 'TVt': 1e72, 'QdVt': 1e75, 'QnVt': 1e78, 'SxVt': 1e81, 'SpVt': 1e84, 
    'OcVt': 1e87, 'NoVt': 1e90, 'Tg': 1e93,
    'UTg': 1e96, 'DTg': 1e99, 'TTg': 1e102, 'QdTg': 1e105, 'QnTg': 1e108, 'SxTg': 1e111, 'SpTg': 1e114, 
    'OcTg': 1e117, 'NoTg': 1e120, 'qg': 1e123,
    'Uqg': 1e126, 'Dqg': 1e129, 'Tqg': 1e132, 'Qdqg': 1e135, 'Qnqg': 1e138, 'Sxqg': 1e141, 'Spqg': 1e144, 
    'Ocqg': 1e147, 'Noqg': 1e150, 'Qg': 1e153,
    'UQg': 1e156, 'DQg': 1e159, 'TQg': 1e162, 'QdQg': 1e165, 'QnQg': 1e168, 'SxQg': 1e171, 'SpQg': 1e174, 
    'OcQg': 1e177, 'NoQg': 1e180, 'sg': 1e183,
    'Usg': 1e186, 'Dsg': 1e189, 'Tsg': 1e192, 'Qdsg': 1e195, 'Qnsg': 1e198, 'Sxsg': 1e201, 'Spsg': 1e204, 
    'Ocsg': 1e207, 'Nosg': 1e210, 'Sg': 1e213,
    'USg': 1e216, 'DSg': 1e219, 'TSg': 1e222, 'QdSg': 1e225, 'QnSg': 1e228, 'SxSg': 1e231, 'SpSg': 1e234, 
    'OcSg': 1e237, 'NoSg': 1e240, 'Og': 1e243,
    'UOg': 1e246, 'DOg': 1e249, 'TOg': 1e252, 'QdOg': 1e255, 'QnOg': 1e258, 'SxOg': 1e261, 'SpOg': 1e264, 
    'OcOg': 1e267, 'NoOg': 1e270, 'Ng': 1e273,
    'UNg': 1e276, 'DNg': 1e279, 'TNg': 1e282, 'QdNg': 1e285, 'QnNg': 1e288, 'SxNg': 1e291, 'SpNg': 1e294, 
    'OcNg': 1e297, 'NoNg': 1e300, 'Ce': 1e303,
    'UCe': 1e306, 'DCe': 1e309, 'TCe': 1e312, 'QdCe': 1e315, 'QnCe': 1e318, 'SxCe': 1e321, 'SpCe': 1e324, 
    'OcCe': 1e327, 'NoCe': 1e330, 'DeCe': 1e333, 'UDeCe': 1e336, 'DDeCe': 1e339, 'TDeCe': 1e342, 
    'QdDeCe': 1e345, 'QnDeCe': 1e348, 'SxDeCe': 1e351, 'SpDeCe': 1e354, 'OcDeCe': 1e357, 'NoDeCe': 1e360,
    'VtCe': 1e363, 'UVtCe': 1e366, 'DVtCe': 1e369, 'TVtCe': 1e372, 'QdVtCe': 1e375, 'QnVtCe': 1e378, 
    'SxVtCe': 1e381, 'SpVtCe': 1e384, 'OcVtCe': 1e387, 'NoVtCe': 1e390, 'TgCe': 1e393, 'UTgCe': 1e396, 
    'DTgCe': 1e399, 'TTgCe': 1e402, 'QdTgCe': 1e405, 'QnTgCe': 1e408, 'SxTgCe': 1e411, 'SpTgCe': 1e414, 
    'OcTgCe': 1e417, 'NoTgCe': 1e420, 'qgCe': 1e423, 'UqgCe': 1e426, 'DqgCe': 1e429, 'TqgCe': 1e432, 
    'QdqgCe': 1e435, 'QnqgCe': 1e438, 'SxqgCe': 1e441, 'SpqgCe': 1e444, 'OcqgCe': 1e447, 'NoqgCe': 1e450,
    'QgCe': 1e453, 'UQgCe': 1e456, 'DQgCe': 1e459, 'TQgCe': 1e462, 'QdQgCe': 1e465, 'QnQgCe': 1e468, 
    'SxQgCe': 1e471, 'SpQgCe': 1e474, 'OcQgCe': 1e477, 'NoQgCe': 1e480, 'sgCe': 1e483, 'UsgCe': 1e486, 
    'DsgCe': 1e489, 'TsgCe': 1e492, 'QdsgCe': 1e495, 'QnsgCe': 1e498, 'SxsgCe': 1e501, 'SpsgCe': 1e504, 
    'OcsgCe': 1e507, 'NosgCe': 1e510, 'SgCe': 1e513, 'USgCe': 1e516, 'DSgCe': 1e519, 'TSgCe': 1e522, 
    'QdSgCe': 1e525, 'QnSgCe': 1e528, 'SxSgCe': 1e531, 'SpSgCe': 1e534, 'OcSgCe': 1e537, 'NoSgCe': 1e540,
    'OgCe': 1e543, 'UOgCe': 1e546, 'DOgCe': 1e549, 'TOgCe': 1e552, 'QdOgCe': 1e555, 'QnOgCe': 1e558, 
    'SxOgCe': 1e561, 'SpOgCe': 1e564, 'OcOgCe': 1e567, 'NoOgCe': 1e570, 'NgCe': 1e573, 'UNgCe': 1e576, 
    'DNgCe': 1e579, 'TNgCe': 1e582, 'QdNgCe': 1e585, 'QnNgCe': 1e588, 'SxNgCe': 1e591, 'SpNgCe': 1e594, 
    'OcNgCe': 1e597, 'NoNgCe': 1e600, 'Du': 1e603,
  };
  return scales;
};

const scale = generateScaleMap();
const scaleEntries = Object.entries(scale).sort(([, a], [, b]) => b - a);
const lowerCaseScaleMap = Object.keys(scale).reduce((acc, key) => {
  acc[key.toLowerCase()] = scale[key];
  return acc;
}, {});

// Find suffixes that are the same when lowercased but different otherwise
const seenLowerCase = new Set();
const conflictingLowerCaseSuffixes = new Set();
for (const key of Object.keys(scale)) {
    const lowerKey = key.toLowerCase();
    if (seenLowerCase.has(lowerKey)) {
        conflictingLowerCaseSuffixes.add(lowerKey);
    } else {
        seenLowerCase.add(lowerKey);
    }
}


const runesData = [
  { name: 'Bloom', source: 'Color Rune', chance: 7.5e9, stats: '1k Boost Spheres + Talent Upgrade (Prisms Talent Tree)' },
  { name: 'Aether', source: 'Polychrome Rune', chance: 1.5e10, stats: 'Rune Luck (MAX x10) + Talent Upgrade (Prisms Talent Tree, Hidden from a big rock on right side)' },
  { name: 'Superstar', source: '5M Beginner', chance: 2.5e10, stats: 'x1M Energy (MAX x1NoNg) + Talent Upgrade (Hall of Fame, Location on center between both Runes, Rune Clone)' },
  { name: 'Vexed', source: 'Polychrome Rune', chance: 5e10, stats: 'x1.05 Tickets (MAX x3) + Talent Upgrade (Realm 2, Hidden close of Cyro Rune on Right side from a floating island)' },
  { name: 'Blizzard', source: 'Arctic Rune', chance: 1e11, stats: 'x1.05 Rune Bulk (MAX x1.3) + Ticket Perk (Rune Luck)' },
  { name: 'Kingslayer', source: '5M Royal', chance: 2.5e11, stats: 'x25K Orbs (Exponential) | (MAX x1NoNg) + x1.25 Rune Luck (MAX x100) + x1.25 Rune Speed (MAX x100)' },
  { name: 'Mystery', source: 'Basic Rune', chance: 1e12, stats: 'x1 Rune Bulk (MAX x5) + -0.1s RToken Cooldown (MAX -60s)' },
  { name: 'Thorn', source: 'Nature Rune', chance: 1e13, stats: 'Ticket Perks Upgrade (Rune Bulk) + x1 Rune Speed (MAX x25k) + x2.5 Tickets (MAX x10B)' },
  { name: 'Divinity', source: '5M Royal', chance: 7.5e16, stats: '+2 Rune Bulk (MAX +100k) + x1 Rune Luck (MAX x10)' },
  { name: 'Abbysium', source: 'Polychrome Rune', chance: 1.25e17, stats: 'x2.1 Tickets (MAX x10K) + x1.01 Rune Bulk (MAX x100)' },
  { name: 'Prosperity', source: '5M Royal', chance: 2.5e22, stats: '-1 Chest Chance (MAX -1/6k) + x1.01 Rune Speed (MAX x100K)' },
  { name: 'Oscillon', source: 'Polychrome Rune', chance: 3.33e27, stats: 'x1.02 Rune Luck (MAX x1M) + ^1 Rune Bulk (MAX ^1.3)' },
  { name: 'Hyper Finality', source: 'Basic Rune', chance: 7.5e32, stats: 'x1 Rune Speed (EXPONENTIAL) + Ticket Perks Upgrade' },
  { name: 'Okay Garmin Save Video', source: 'Cryo Rune', chance: 1e42, stats: 'x1 Tickets (MAX x1SxDe)' },
  { name: 'Gleam', source: 'Color Rune', chance: 1e47, stats: 'x1.01 Rune Speed (MAX x1K) + x1 Rune Bulk (MAX x10K)' },
  { name: 'Shyft', source: 'Basic Rune', chance: 7.5e55, stats: '+1 Walkspeed (MAX 30) +7 Rune Bulk (MAX +500k) + New Talent (Behind the Basic Rune on island)' },
  { name: 'Overlord', source: '5M Beginner', chance: 5e58, stats: 'x1.01 Energy (EXPONENTIAL) + +24 Rune Bulk (MAX +100M)' },
  { name: 'Mirror', source: 'Arctic Rune', chance: 7.5e60, stats: 'x1.01 Rune Speed (MAX 50k) + x1 Rune Speed (MAX 500k)' },
  { name: 'Oblivion', source: 'Polychrome Rune', chance: 5e73, stats: 'x1.02 Rune Bulk (MAX x50k) + New Talent' },
  { name: 'Immortality', source: '5M Royal', chance: 2e82, stats: 'x2 Rune Bulk (EXPODENTIAL) (MAX x1B)' },
  { name: 'Vanta', source: 'Color Rune', chance: 7e95, stats: 'x2 Rune Speed (EXPONENTIAL) + x1 Rune Bulk (MAX ???) + x2 Tickets' },
  { name: 'Odyssey', source: '5M Royal', chance: 1.5e109, stats: 'x1 Rune Bulk (EXPONENTIAL) + x1 Rune Bulk (MAX ???) + x1 Rune Speed (MAX ???)' },
  { name: 'Frostbite', source: 'Arctic Rune', chance: 3e103, stats: 'x1.01 Rune Speed (MAX x100k) + New Talent' },
  { name: 'Destiny', source: '5M Royal', chance: 5e121, stats: 'x1 Rune Bullk (MAX x10K) + x1 Rune Speed (MAX ???)' },
  { name: 'Squid', source: 'Nature Rune', chance: 1.5e130, stats: 'Ticket Perk (Rune Bulk) + x2 Rune Bulk (MAX ???) + x? Tickets (MAX ???)' },
  { name: 'Array', source: 'Basic Rune', chance: 1e135, stats: '+? Rune Bulk (MAX + 25B) + x1 Rune Bulk (MAX x25) + x1 Tickets' },
  { name: 'Cyclone', source: 'Nature Rune', chance: 2.5e140, stats: '+^1.2 Rune Bulk + x1K Rune Speed + Talent Upgrade (T1 area on a hill)' },
  { name: 'Stray', source: 'Cryo Rune', chance: 1e160, stats: 'x1 Rune Speed [EXPONENTIAL] + x1 Tickets [EXPONENTIAL]' },
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
    if (typeof num !== 'number' || !isFinite(num)) return '0';
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

/**
 * Parses a string like "1.5M" or "100QdVt" into a number, handling case-sensitivity for ambiguous suffixes.
 * @param {string} input - The string to parse.
 * @returns {{value: number, warning: string|null}} The parsed numeric value and any warning.
 */
function parseRpsInput(input) {
    if (typeof input !== 'string' || !input) return { value: 0, warning: null };
    const cleanedInput = input.trim();
    
    const match = cleanedInput.match(/^(\d*\.?\d+)\s*([a-zA-Z]+)$/);

    if (match) {
        const numPart = parseFloat(match[1]);
        const scalePart = match[2]; // Keep original case

        // 1. Try case-sensitive match first
        if (scale[scalePart]) {
            return { value: numPart * scale[scalePart], warning: null };
        }

        // 2. If no direct match, check for ambiguity
        const lowerScalePart = scalePart.toLowerCase();
        if (conflictingLowerCaseSuffixes.has(lowerScalePart)) {
            const options = Object.keys(scale).filter(k => k.toLowerCase() === lowerScalePart).join(', ');
            const warningMessage = `Warning: '${scalePart}' is ambiguous. Use one of these case-sensitive options: ${options}.`;
            return { value: 0, warning: warningMessage };
        }

        // 3. If not ambiguous, try case-insensitive match
        const multiplier = lowerCaseScaleMap[lowerScalePart];
        if (multiplier) {
            return { value: numPart * multiplier, warning: null };
        }
    }

    const plainNumber = parseFloat(cleanedInput);
    return isNaN(plainNumber) ? { value: 0, warning: null } : { value: plainNumber, warning: null };
}


// --- Custom Components ---
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

const ChangelogModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-cyan-400">Changelog</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="space-y-6">
                    {changelog.map(entry => (
                        <div key={entry.version} className="border-l-4 border-cyan-500 pl-4">
                            <h3 className="text-xl font-bold text-white">Version {entry.version} <span className="text-sm text-gray-400 font-normal">- {entry.date}</span></h3>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
                                {entry.changes.map((change, index) => <li key={index}>{change}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Main Application Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [rawRpsInput, setRawRpsInput] = useState('1M');
  const [hideInstant, setHideInstant] = useState(true);
  const [sortOrder, setSortOrder] = useState('asc');
  const [runeFilter, setRuneFilter] = useState('');
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);

  useEffect(() => {
    const savedRps = localStorage.getItem('runeCalc_rawRpsInput');
    if (savedRps) setRawRpsInput(savedRps);
  }, []);

  useEffect(() => {
    localStorage.setItem('runeCalc_rawRpsInput', rawRpsInput);
  }, [rawRpsInput]);

  const { rps, rpsWarning } = useMemo(() => {
      const { value, warning } = parseRpsInput(rawRpsInput);
      return { rps: value, rpsWarning: warning };
  }, [rawRpsInput]);

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
      {isChangelogVisible && <ChangelogModal onClose={() => setIsChangelogVisible(false)} />}
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 mb-2">Rune Time Calculator</h1>
          <p className="text-lg text-gray-400">A strategic tool for planning your progression. Times shown are for a single rune. <span className="text-xs text-gray-500">v{version}</span></p>
        </header>

        <div className="flex border-b border-gray-700 mb-0">
            <TabButton tabName="calculator" label="Rune Calculator" />
            <TabButton tabName="whatif" label="Target 'What If?'" />
        </div>
        
        <div className="bg-gray-800 p-6 rounded-b-xl shadow-lg">
            {activeTab === 'calculator' && (
                <div>
                    <div className="bg-orange-900/50 border border-orange-500/30 text-orange-300 text-center p-3 rounded-lg mb-6">
                        Notice an incorrect chance? Message <strong className="font-bold">@LeftySix</strong> on Discord with the correct value!
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-4 sticky top-4 z-10">
                        <h3 className="text-xl font-bold text-center text-white mb-4">My Current Rate</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <input type="text" value={rawRpsInput} onChange={(e) => setRawRpsInput(e.target.value)} className="w-full bg-gray-700 text-white text-lg p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 95QnVt" />
                        </div>
                        {rpsWarning && (
                            <div className="text-center bg-yellow-900/50 border border-yellow-500/30 text-yellow-300 p-3 mt-4 rounded-lg">
                                {rpsWarning}
                            </div>
                        )}
                        <p className="text-center text-cyan-300 mt-4 text-lg">
                            Parsed Rate: {formatNumber(rps)} RPS
                        </p>
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
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-bold text-white">{rune.name}</h2>
                                        <p className="text-sm text-gray-400">{rune.source}</p>
                                        <p className="text-sm text-cyan-400">{formatChance(rune.chance)}</p>
                                        <p className="text-sm text-green-400 mt-2">
                                            <strong className="font-semibold">Gives: </strong>
                                            {rune.stats}
                                        </p>
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
            <p>Calculator v{version} | <button onClick={() => setIsChangelogVisible(true)} className="underline hover:text-cyan-400">Changelog</button></p>
            <p className="mt-1">Based on user-provided data.</p>
        </footer>
      </div>
    </div>
  );
}
