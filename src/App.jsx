import React, { useState, useMemo, useEffect, useRef } from 'react';

// --- App Info & Data ---
const version = '1.8.0';
const guideLink = 'https://docs.google.com/spreadsheets/d/1FWuPcp1QvIn-TAJkD1nRPtZnVwotBHcqR17xOR8SkHg/htmlview?gid=623912504#gid=539880323';

const changelog = [
    {
        version: '1.8.0',
        date: '2025-08-07',
        changes: [
            'Implemented cache-busting for data fetching to ensure the calculator always uses the most up-to-date rune data from GitHub.'
        ]
    },
    {
        version: '1.7.0',
        date: '2025-08-07',
        changes: [
            'All input fields now save their values to local storage and are restored on page load.',
            'Synced the "Target Rune", "Current #", "Rune Speed", and "Rune Bulk" inputs between the "Time to Max" and "Time to X Runes" tabs for a smoother experience.',
            'Added a prominent alpha warning to the "Time to..." tabs to manage expectations about calculation accuracy, especially for exponential runes.'
        ]
    },
    {
        version: '1.6.0',
        date: '2025-08-07',
        changes: [
            'Implemented dynamic, iterative calculations for "Time to Max" and "Time to X Runes" tabs.',
            'The calculators now simulate acquiring each rune one-by-one and apply its compounding bonuses (additive, multiplicative, and exponential) to Rune Speed and Bulk.',
            'This provides a significantly more accurate time estimate that reflects getting faster over time.'
        ]
    },
    {
        version: '1.5.0',
        date: '2025-08-06',
        changes: [
            'Added a "Time to X Runes" calculator tab for validation and testing purposes.',
            'This new tool allows users to input a custom target number of runes to estimate the time required to reach it.'
        ]
    },
    {
        version: '1.4.0',
        date: '2025-08-06',
        changes: [
            'Corrected the RPS formula to be a direct multiplication: RPS = Rune Speed * Rune Bulk.',
            'Simplified the "Time to Max" calculator to only use Rune Speed and Rune Bulk inputs, as these stats are now understood to be live and all-inclusive.',
            'Removed all unnecessary input fields for event buffs and other multipliers.'
        ]
    },
];

// --- Analytics (Connected) ---
const trackEvent = (eventName, eventParams) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
    } else {
        console.log(`Analytics Event (GA not found): ${eventName}`, eventParams);
    }
};


// --- Helper Functions ---
const foreverQuotes = [
    "Heat death of the universe",
    "Basically forever",
    "Just don't even try",
    "An eternity or two",
    "Beyond comprehension"
];

function formatTime(totalSeconds) {
    if (totalSeconds < 0 || !isFinite(totalSeconds)) return '...';
    if (totalSeconds < 1) return 'Instant';

    const oneHundredYearsInSeconds = 100 * 31536000;
    if (totalSeconds > oneHundredYearsInSeconds) {
        return foreverQuotes[Math.floor(Math.random() * foreverQuotes.length)];
    }

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

// --- Iterative Calculation Logic ---
const calculateCompoundingTime = (rune, startCount, endCount, initialSpeed, initialBulk, formatNumber, formatTime) => {
    if (!rune || !rune.bonuses) return { totalTime: Infinity, finalRps: 0, traceLog: [] };

    let currentSpeed = initialSpeed;
    let currentBulk = initialBulk;
    let totalTimeSeconds = 0;
    const traceLog = [];

    for (let count = startCount; count < endCount; count++) {
        const currentRps = currentSpeed * currentBulk;
        if (currentRps <= 0) return { totalTime: Infinity, finalRps: 0, traceLog: ['Error: RPS is zero or negative.'] };

        const timeForNextRune = rune.chance / currentRps;
        totalTimeSeconds += timeForNextRune;

        if (traceLog.length < 200) {
            const rpsFormatted = formatNumber ? formatNumber(currentRps) : currentRps.toExponential(2);
            const speedFormatted = formatNumber ? formatNumber(currentSpeed) : currentSpeed.toExponential(2);
            const bulkFormatted = formatNumber ? formatNumber(currentBulk) : currentBulk.toExponential(2);
            const timeFormatted = formatTime ? formatTime(timeForNextRune) : `${timeForNextRune.toFixed(2)}s`;
            traceLog.push(`Rune #${count + 1}: Speed=${speedFormatted}, Bulk=${bulkFormatted}, RPS=${rpsFormatted} -> Time: ${timeFormatted}`);
        }


        // Apply bonuses for the rune that was just "acquired"
        rune.bonuses.forEach(bonus => {
            if (typeof bonus.value !== 'number') return;

            const value = bonus.value;
            // This logic assumes bonuses are applied based on having the rune, not per count.
            // Exponential logic would need to be more specific if it depends on the count.
            if (bonus.isExponential || bonus.isDualExponential) {
                // NOTE: The current data doesn't provide a clear formula for how exponential bonuses scale with count.
                // This calculation is a placeholder and likely inaccurate for exponential runes.
                // For now, we treat it like a standard multiplier. A more complex, formula-parsing implementation is needed for full accuracy.
            }

            if (bonus.type === 'runeSpeed') {
                if (bonus.modifier === 'additive') {
                    currentSpeed += value;
                } else if (bonus.modifier === 'multiplier') {
                    if (bonus.isExponential || bonus.isDualExponential) {
                        currentSpeed *= value;
                    } else {
                        const linear_value = bonus.value - 1;
                        let mult_before = 1 + count * linear_value;
                        let mult_after = 1 + (count + 1) * linear_value;

                        if (bonus.max) {
                            mult_before = Math.min(mult_before, bonus.max);
                            mult_after = Math.min(mult_after, bonus.max);
                        }

                        if (mult_before > 0 && mult_before !== mult_after) {
                            currentSpeed *= (mult_after / mult_before);
                        }
                    }
                } else if (bonus.modifier === 'power') {
                    currentSpeed = Math.pow(currentSpeed, value);
                }
            } else if (bonus.type === 'runeBulk') {
                if (bonus.modifier === 'additive') {
                    currentBulk += value;
                } else if (bonus.modifier === 'multiplier') {
                    if (bonus.isExponential || bonus.isDualExponential) {
                        currentBulk *= value;
                    } else {
                        const linear_value = bonus.value - 1;
                        let mult_before = 1 + count * linear_value;
                        let mult_after = 1 + (count + 1) * linear_value;

                        if (bonus.max) {
                            mult_before = Math.min(mult_before, bonus.max);
                            mult_after = Math.min(mult_after, bonus.max);
                        }

                        if (mult_before > 0 && mult_before !== mult_after) {
                            currentBulk *= (mult_after / mult_before);
                        }
                    }
                } else if (bonus.modifier === 'power') {
                    currentBulk = Math.pow(currentBulk, value);
                }
            }
        });
    }

    const finalRps = currentSpeed * currentBulk;
    return { totalTime: totalTimeSeconds, finalRps, traceLog };
};


// --- Custom Components ---

const AlphaWarning = () => (
    <div className="bg-red-900/50 border-2 border-dashed border-red-500/30 text-red-200 text-center p-3 rounded-lg mb-6">
        <h3 className="font-bold text-lg">ALPHA WARNING</h3>
        <p className="text-sm">These "Time to..." calculators are for feedback only. The logic is experimental and likely inaccurate, especially for runes with exponential bonuses. Please do not rely on these estimates for serious planning yet. Also, don't spam me with issues. I've probably already been told about them. P.S. Gaining global runes will completely break any sort of accuracy in the time estimate.</p>
    </div>
);

const TargetCalculator = ({ runesData, formatNumber }) => {
    const [targetRuneName, setTargetRuneName] = useState(runesData[0].name);
    const [targetTime, setTargetTime] = useState('30');
    const [targetTimeUnit, setTargetTimeUnit] = useState('60'); // minutes

    const requiredRps = useMemo(() => {
        const rune = runesData.find(r => r.name === targetRuneName);
        if (!rune || typeof rune.chance !== 'number') return 0;
        const timeInSeconds = parseFloat(targetTime) * parseFloat(targetTimeUnit);
        if (timeInSeconds <= 0) return Infinity;
        return rune.chance / timeInSeconds;
    }, [targetRuneName, targetTime, targetTimeUnit, runesData]);

    return (
        <div className="p-1">
            <h2 className="text-2xl text-center font-bold text-cyan-400 mb-4">"What If?" Target Calculator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select value={targetRuneName} onChange={e => setTargetRuneName(e.target.value)} className="bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500">
                    {runesData.filter(r => typeof r.chance === 'number').sort((a, b) => a.chance - b.chance).map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
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

const TimeToMaxCalculator = ({ runesData, parseRpsInput, formatTime, formatNumber, syncedState, setSyncedState }) => {
    const { selectedRuneName, currentCount, runeSpeed, runeBulk } = syncedState;
    const { setSelectedRuneName, setCurrentCount, setRuneSpeed, setRuneBulk } = setSyncedState;
    const [showTrace, setShowTrace] = useState(false);

    const calculation = useMemo(() => {
        const rune = runesData.find(r => r.name === selectedRuneName);
        if (!rune) return { rps: 0, timeToMax: 'Select a rune', runesNeeded: 0, traceLog: [] };

        const initialSpeed = parseRpsInput(runeSpeed).value;
        const initialBulk = parseRpsInput(runeBulk).value;
        const initialRps = initialSpeed * initialBulk;

        const maxCount = parseInt(String(rune.max).replace(/,/g, ''), 10);
        if (isNaN(maxCount)) return { rps: initialRps, timeToMax: 'Max count not specified', runesNeeded: 'N/A', traceLog: [] };

        const startCount = parseInt(currentCount, 10) || 0;
        const runesNeeded = maxCount - startCount;

        if (runesNeeded <= 0) return { rps: initialRps, timeToMax: 'Already maxed!', runesNeeded: 0, traceLog: [] };
        if (initialRps <= 0) return { rps: 0, timeToMax: 'Enter valid stats', runesNeeded, traceLog: [] };

        const { totalTime, traceLog } = calculateCompoundingTime(rune, startCount, maxCount, initialSpeed, initialBulk, formatNumber, formatTime);

        return { rps: initialRps, timeToMax: formatTime(totalTime), runesNeeded, traceLog };
    }, [selectedRuneName, currentCount, runeSpeed, runeBulk, runesData, parseRpsInput, formatTime, formatNumber]);

    return (
        <div className="p-1">
            <AlphaWarning />
            <h2 className="text-2xl text-center font-bold text-cyan-400 mb-4">Time to Max Rune Calculator</h2>
            <p className="text-center text-gray-400 mb-6 -mt-2 text-sm">Estimates total time, accounting for compounding bonuses from each rune gained.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Rune</label>
                    <select value={selectedRuneName} onChange={e => setSelectedRuneName(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500">
                        {runesData.filter(r => typeof r.chance === 'number' && !isNaN(parseInt(String(r.max).replace(/,/g, ''), 10))).sort((a, b) => a.chance - b.chance).map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Current # of this Rune</label>
                    <input type="number" value={currentCount} onChange={e => setCurrentCount(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 10" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your In-Game Rune Speed</label>
                    <input type="text" value={runeSpeed} onChange={e => setRuneSpeed(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 100Qn" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your In-Game Rune Bulk</label>
                    <input type="text" value={runeBulk} onChange={e => setRuneBulk(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 500T" />
                </div>
            </div>

            <div className="text-center bg-gray-900 p-4 rounded-lg mt-6 space-y-4">
                <div>
                    <p className="text-gray-400">Initial Runes Per Second (RPS)</p>
                    <p className="text-xl font-bold text-cyan-300 mt-1">{formatNumber(calculation.rps)}</p>
                </div>
                <div>
                    <p className="text-gray-400">Runes Needed to Max</p>
                    <p className="text-xl font-bold text-cyan-300 mt-1">{formatNumber(calculation.runesNeeded)}</p>
                </div>
                <div>
                    <p className="text-gray-400">Estimated Time to Max (w/ Bonuses)</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{calculation.timeToMax}</p>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={() => setShowTrace(!showTrace)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                    {showTrace ? 'Hide' : 'Show'} Calculation Trace
                </button>
                {showTrace && (
                    <pre className="bg-gray-900 text-left text-xs text-gray-400 p-4 rounded-b-lg mt-0 max-h-64 overflow-y-auto">
                        {calculation.traceLog.join('\n')}
                    </pre>
                )}
            </div>
        </div>
    );
};

const TimeToXCalculator = ({ runesData, parseRpsInput, formatTime, formatNumber, syncedState, setSyncedState }) => {
    const { selectedRuneName, currentCount, targetCount, runeSpeed, runeBulk } = syncedState;
    const { setSelectedRuneName, setCurrentCount, setTargetCount, setRuneSpeed, setRuneBulk } = setSyncedState;
    const [showTrace, setShowTrace] = useState(false);

    const calculation = useMemo(() => {
        const rune = runesData.find(r => r.name === selectedRuneName);
        if (!rune) return { rps: 0, timeToTarget: 'Select a rune', runesNeeded: 0, traceLog: [] };

        const initialSpeed = parseRpsInput(runeSpeed).value;
        const initialBulk = parseRpsInput(runeBulk).value;
        const initialRps = initialSpeed * initialBulk;

        const endCount = parseInt(targetCount, 10) || 0;
        const startCount = parseInt(currentCount, 10) || 0;
        const runesNeeded = endCount - startCount;

        if (runesNeeded <= 0) return { rps: initialRps, timeToTarget: 'Target reached or passed!', runesNeeded: 0, traceLog: [] };
        if (initialRps <= 0) return { rps: 0, timeToTarget: 'Enter valid stats', runesNeeded, traceLog: [] };

        const { totalTime, traceLog } = calculateCompoundingTime(rune, startCount, endCount, initialSpeed, initialBulk, formatNumber, formatTime);

        return { rps: initialRps, timeToTarget: formatTime(totalTime), runesNeeded, traceLog };
    }, [selectedRuneName, currentCount, targetCount, runeSpeed, runeBulk, runesData, parseRpsInput, formatTime, formatNumber]);

    return (
        <div className="p-1">
            <AlphaWarning />
            <h2 className="text-2xl text-center font-bold text-cyan-400 mb-4">Time to X Runes Calculator</h2>
            <p className="text-center text-gray-400 mb-6 -mt-2 text-sm">A tool to help test and validate calculations for a specific number of runes.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Rune</label>
                    <select value={selectedRuneName} onChange={e => setSelectedRuneName(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500">
                        {runesData.filter(r => typeof r.chance === 'number').sort((a, b) => a.chance - b.chance).map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target # of this Rune</label>
                    <input type="number" value={targetCount} onChange={e => setTargetCount(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Current # of this Rune</label>
                    <input type="number" value={currentCount} onChange={e => setCurrentCount(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 18" />
                </div>
                <div></div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your In-Game Rune Speed</label>
                    <input type="text" value={runeSpeed} onChange={e => setRuneSpeed(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 100Qn" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your In-Game Rune Bulk</label>
                    <input type="text" value={runeBulk} onChange={e => setRuneBulk(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-cyan-500" placeholder="e.g., 500T" />
                </div>
            </div>

            <div className="text-center bg-gray-900 p-4 rounded-lg mt-6 space-y-4">
                <div>
                    <p className="text-gray-400">Initial Runes Per Second (RPS)</p>
                    <p className="text-xl font-bold text-cyan-300 mt-1">{formatNumber(calculation.rps)}</p>
                </div>
                <div>
                    <p className="text-gray-400">Runes Needed for Target</p>
                    <p className="text-xl font-bold text-cyan-300 mt-1">{formatNumber(calculation.runesNeeded)}</p>
                </div>
                <div>
                    <p className="text-gray-400">Estimated Time to Target (w/ Bonuses)</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{calculation.timeToTarget}</p>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={() => setShowTrace(!showTrace)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                    {showTrace ? 'Hide' : 'Show'} Calculation Trace
                </button>
                {showTrace && (
                    <pre className="bg-gray-900 text-left text-xs text-gray-400 p-4 rounded-b-lg mt-0 max-h-64 overflow-y-auto">
                        {calculation.traceLog.join('\n')}
                    </pre>
                )}
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

const RuneTag = ({ tag }) => {
    const tagStyles = {
        limited: 'bg-red-500/20 text-red-300 border-red-500/30',
        hidden: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        exponential: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        default: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    const style = tagStyles[tag.toLowerCase()] || tagStyles.default;
    return (
        <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full border ${style}`}>
            {tag}
        </span>
    );
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
);

// --- Bonus Display Components ---
const BonusIcon = ({ type }) => {
    const iconStyle = "w-5 h-5 mr-3 text-cyan-400";
    let iconName = "check-circle"; // Default icon

    switch (type) {
        case 'runeSpeed': iconName = "zap"; break;
        case 'runeLuck': iconName = "clover"; break;
        case 'runeBulk': iconName = "layers"; break;
        case 'tickets': iconName = "ticket"; break;
        case 'energy': iconName = "battery-charging"; break;
        case 'orbs': iconName = "circle-dot"; break;
        case 'newTalent':
        case 'talentUpgrade':
        case 'ticketPerk':
            iconName = "sparkles"; break;
        default: iconName = "award"; break;
    }

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [type]);

    return <i data-lucide={iconName} className={iconStyle}></i>;
};

const BonusDisplay = ({ bonus, formatNumber }) => {
    const statNameMap = {
        runeSpeed: "Rune Speed",
        runeLuck: "Rune Luck",
        runeBulk: "Rune Bulk",
        tickets: "Tickets",
        energy: "Energy",
        orbs: "Orbs",
        chrome: "Chrome",
        walkspeed: "Walkspeed",
        chestChance: "Chest Chance",
        rTokenCooldown: "RToken Cooldown",
        baseChrome: "Base Chrome",
        boostSpheres: "Boost Spheres",
        hail: "Hail"
    };

    const modifierMap = {
        multiplier: 'x',
        additive: '+',
        subtractive: '-',
        power: '^'
    };

    return (
        <div className="flex items-center text-green-300">
            <BonusIcon type={bonus.type} />
            <span className="flex-1">
                <span className="font-bold">{modifierMap[bonus.modifier] || ''}{formatNumber(bonus.value)}</span>
                {' '}{statNameMap[bonus.type] || bonus.type}
                {bonus.max && <span className="text-gray-400 text-sm ml-2">(Max: {typeof bonus.max === 'number' ? formatNumber(bonus.max) : bonus.max})</span>}
            </span>
            {bonus.isExponential && <span className="ml-2 text-xs font-bold text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded">EXP</span>}
            {bonus.isDualExponential && <span className="ml-2 text-xs font-bold text-orange-400 bg-orange-900/50 px-2 py-1 rounded">DUAL EXP</span>}
        </div>
    );
};


// --- Main Application Component ---
export default function App() {
    const [appData, setAppData] = useState({ runes: null, scales: null, status: 'loading', error: null });
    const [activeTab, setActiveTab] = useState('calculator');
    const [hideInstant, setHideInstant] = useState(true);
    const [sortOrder, setSortOrder] = useState('asc');
    const [runeFilter, setRuneFilter] = useState('');
    const [customRuneChance, setCustomRuneChance] = useState('1e300');
    const [isChangelogVisible, setIsChangelogVisible] = useState(false);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);

    // State for the main calculator's RPS input
    const [rawRpsInput, setRawRpsInput] = useState('1M');

    // Synced state for the "Time to..." calculators
    const [selectedRuneName, setSelectedRuneName] = useState('Superstar');
    const [currentCount, setCurrentCount] = useState('18');
    const [targetCount, setTargetCount] = useState('19');
    const [runeSpeed, setRuneSpeed] = useState('11.9QnTg');
    const [runeBulk, setRuneBulk] = useState('57.62Qdqg');

    // Effect to fetch data from external GitHub links
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Define fetch options to disable caching
                const fetchOptions = { cache: 'no-store' };
                // Generate a unique value for the query parameter
                const cacheBuster = `?v=${Date.now()}`;

                const [runesResponse, scalesResponse] = await Promise.all([
                    fetch(`https://raw.githubusercontent.com/truthuntold/ai-rune-calc/refs/heads/main/public/runes.json${cacheBuster}`, fetchOptions),
                    fetch(`https://raw.githubusercontent.com/truthuntold/ai-rune-calc/refs/heads/main/public/scales.json${cacheBuster}`, fetchOptions)
                ]);
                if (!runesResponse.ok || !scalesResponse.ok) {
                    throw new Error('Network response was not ok');
                }
                const runes = await runesResponse.json();
                const scales = await scalesResponse.json();

                // Set default selected rune once data is loaded
                const defaultRune = runes.find(r => typeof r.chance === 'number' && !isNaN(parseInt(String(r.max).replace(/,/g, ''), 10))) || runes[0];
                setSelectedRuneName(localStorage.getItem('runeCalc_selectedRuneName') || defaultRune.name);

                setAppData({ runes, scales, status: 'loaded', error: null });
            } catch (error) {
                console.error("Failed to fetch data from GitHub.", error);
                setAppData({ runes: [], scales: {}, status: 'error', error: 'Failed to load data from GitHub. Please check your connection and try again.' });
            }
        };
        fetchData();
    }, []);

    // Load all saved states from localStorage on initial mount
    useEffect(() => {
        const savedRps = localStorage.getItem('runeCalc_rawRpsInput');
        if (savedRps) setRawRpsInput(savedRps);

        const savedCurrentCount = localStorage.getItem('runeCalc_currentCount');
        if (savedCurrentCount) setCurrentCount(savedCurrentCount);

        const savedTargetCount = localStorage.getItem('runeCalc_targetCount');
        if (savedTargetCount) setTargetCount(savedTargetCount);

        const savedRuneSpeed = localStorage.getItem('runeCalc_runeSpeed');
        if (savedRuneSpeed) setRuneSpeed(savedRuneSpeed);

        const savedRuneBulk = localStorage.getItem('runeCalc_runeBulk');
        if (savedRuneBulk) setRuneBulk(savedRuneBulk);

        const lastVisitedVersion = localStorage.getItem('runeCalc_lastVisitedVersion');
        if (lastVisitedVersion && lastVisitedVersion !== version) {
            setShowUpdateNotification(true);
        }
        localStorage.setItem('runeCalc_lastVisitedVersion', version);
    }, []);

    // Save all states to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('runeCalc_rawRpsInput', rawRpsInput);
        localStorage.setItem('runeCalc_selectedRuneName', selectedRuneName);
        localStorage.setItem('runeCalc_currentCount', currentCount);
        localStorage.setItem('runeCalc_targetCount', targetCount);
        localStorage.setItem('runeCalc_runeSpeed', runeSpeed);
        localStorage.setItem('runeCalc_runeBulk', runeBulk);
    }, [rawRpsInput, selectedRuneName, currentCount, targetCount, runeSpeed, runeBulk]);


    // Memoize scale-dependent calculations
    const scaleUtils = useMemo(() => {
        if (appData.status !== 'loaded') return null;
        const { scales } = appData;
        const scaleEntries = Object.entries(scales).sort(([, a], [, b]) => b - a);
        const lowerCaseScaleMap = Object.keys(scales).reduce((acc, key) => {
            acc[key.toLowerCase()] = scales[key];
            return acc;
        }, {});
        const seenLowerCase = new Set();
        const conflictingLowerCaseSuffixes = new Set();
        for (const key of Object.keys(scales)) {
            const lowerKey = key.toLowerCase();
            if (seenLowerCase.has(lowerKey)) {
                conflictingLowerCaseSuffixes.add(lowerKey);
            } else {
                seenLowerCase.add(lowerKey);
            }
        }
        return { scales, scaleEntries, lowerCaseScaleMap, conflictingLowerCaseSuffixes };
    }, [appData]);

    // Helper functions that depend on scaleUtils
    const formatNumber = useMemo(() => (num) => {
        if (!scaleUtils || typeof num !== 'number' || !isFinite(num)) return '0';
        if (num < 1000 && Number.isInteger(num)) return num.toString();
        for (const [suffix, value] of scaleUtils.scaleEntries) {
            if (value > 0 && num >= value) {
                const scaledNum = (num / value).toPrecision(3);
                return `${parseFloat(scaledNum)} ${suffix}`;
            }
        }
        return num.toPrecision(3);
    }, [scaleUtils]);

    const parseRpsInput = useMemo(() => (input) => {
        if (!scaleUtils || typeof input !== 'string' || !input) return { value: 0, warning: null };
        const cleanedInput = input.trim();
        const match = cleanedInput.match(/^(\d*\.?\d+)\s*([a-zA-Z]+)$/);

        if (match) {
            const numPart = parseFloat(match[1]);
            const scalePart = match[2];

            if (scaleUtils.scales[scalePart]) {
                return { value: numPart * scaleUtils.scales[scalePart], warning: null };
            }

            const lowerScalePart = scalePart.toLowerCase();
            if (scaleUtils.conflictingLowerCaseSuffixes.has(lowerScalePart)) {
                const options = Object.keys(scaleUtils.scales).filter(k => k.toLowerCase() === lowerScalePart).join(', ');
                const warningMessage = `Warning: '${scalePart}' is ambiguous. Use one of these case-sensitive options: ${options}.`;
                return { value: 0, warning: warningMessage };
            }

            const multiplier = scaleUtils.lowerCaseScaleMap[lowerScalePart];
            if (multiplier) {
                return { value: numPart * multiplier, warning: null };
            }
        }
        const plainNumber = parseFloat(cleanedInput);
        return isNaN(plainNumber) ? { value: 0, warning: null } : { value: plainNumber, warning: null };
    }, [scaleUtils]);

    const formatChance = useMemo(() => (rune) => {
        const { chance } = rune;
        if (typeof chance === 'object' && chance.unit) {
            return `${formatNumber(chance.value)} ${chance.unit}`;
        }
        if (typeof chance === 'number') {
            const scientific = `(${chance.toExponential(0)})`;
            return `1 / ${formatNumber(chance)} ${scientific}`;
        }
        return 'N/A';
    }, [formatNumber]);

    function getNumericChance(rune) {
        if (typeof rune.chance === 'number') {
            return rune.chance;
        }
        return Infinity;
    }

    const { rps, rpsWarning } = useMemo(() => {
        if (!scaleUtils) return { rps: 0, rpsWarning: null };
        const { value, warning } = parseRpsInput(rawRpsInput);
        return { rps: value, rpsWarning: warning };
    }, [rawRpsInput, scaleUtils, parseRpsInput]);

    const customRuneDetails = useMemo(() => {
        if (!scaleUtils) return { parsedChance: 0, time: Infinity };
        const { value: parsedChance } = parseRpsInput(customRuneChance);
        const time = rps > 0 ? parsedChance / rps : Infinity;
        return { parsedChance, time };
    }, [customRuneChance, rps, scaleUtils, parseRpsInput]);

    const customRuneConversion = useMemo(() => {
        if (!scaleUtils) return '';
        const input = customRuneChance.trim();
        if (!input) return '';
        const isScientific = /e[+-]?\d/i.test(input);
        if (isScientific) {
            const num = parseFloat(input);
            if (isNaN(num)) return '';
            return `(${formatNumber(num)})`;
        } else {
            const { value: parsedValue } = parseRpsInput(input);
            if (parsedValue === 0 || !isFinite(parsedValue) || String(parsedValue) === input) return '';
            return `(${parsedValue.toExponential()})`;
        }
    }, [customRuneChance, scaleUtils, formatNumber, parseRpsInput]);

    const { processedRunes, nextUpgradeName } = useMemo(() => {
        if (appData.status !== 'loaded') return { processedRunes: [], nextUpgradeName: null };

        let nextUpgrade = null;
        const filtered = appData.runes
            .map(rune => ({
                ...rune,
                time: rps > 0 ? getNumericChance(rune) / rps : Infinity,
            }))
            .filter(rune => {
                const matchesFilter = rune.name.toLowerCase().includes(runeFilter.toLowerCase()) || rune.source.toLowerCase().includes(runeFilter.toLowerCase());
                const isInstant = rune.time < 1;
                return matchesFilter && (!hideInstant || !isInstant);
            })
            .sort((a, b) => {
                const chanceA = getNumericChance(a);
                const chanceB = getNumericChance(b);
                return sortOrder === 'asc' ? chanceA - chanceB : chanceB - chanceA;
            });

        if (sortOrder === 'asc') {
            nextUpgrade = filtered.find(r => r.time >= 1 && r.time < 3600) || null;
        }

        return { processedRunes: filtered, nextUpgradeName: nextUpgrade?.name };
    }, [rps, hideInstant, sortOrder, runeFilter, appData]);

    const syncedState = {
        selectedRuneName, currentCount, targetCount, runeSpeed, runeBulk
    };

    const setSyncedState = {
        setSelectedRuneName, setCurrentCount, setTargetCount, setRuneSpeed, setRuneBulk
    };

    const TabButton = ({ tabName, label }) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`px-4 py-3 text-md font-bold rounded-t-lg transition-colors duration-300 ${isActive
                    ? 'bg-gray-800 text-cyan-400'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
            >
                {label}
            </button>
        );
    };

    if (appData.status === 'loading') {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            {isChangelogVisible && <ChangelogModal onClose={() => setIsChangelogVisible(false)} />}
            <div className="max-w-4xl mx-auto">

                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 mb-2">Rune Time Calculator</h1>
                    <p className="text-lg text-gray-400">A strategic tool for planning your progression. <span className="text-xs text-gray-500">v{version}</span></p>
                    <div className="bg-blue-900/50 border border-blue-500/30 text-blue-300 text-center p-3 rounded-lg mt-6 max-w-xl mx-auto">
                        <p>
                            🚀 For a wealth of extra info, check out the{' '}
                            <a href={guideLink} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-white">
                                Comprehensive Google Doc
                            </a>!
                        </p>
                    </div>
                </header>

                {appData.error && (
                    <div className="bg-red-900/50 border border-red-500/30 text-red-300 text-center p-3 rounded-lg mb-6">
                        <p>{appData.error}</p>
                    </div>
                )}


                <div className="flex border-b border-gray-700 mb-0 flex-wrap">
                    <TabButton tabName="calculator" label="Rune Calculator" />
                    <TabButton tabName="timetomax" label="Time to Max" />
                    <TabButton tabName="timetox" label="Time to X Runes" />
                    <TabButton tabName="whatif" label="Target 'What If?'" />
                </div>

                <div className="bg-gray-800 p-6 rounded-b-xl shadow-lg">
                    {activeTab === 'calculator' && (
                        <div>
                            {showUpdateNotification && (
                                <div className="bg-blue-900/50 border border-blue-500/30 text-blue-300 text-center p-3 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                                    <span>
                                        Updated to v{version}!
                                        <button
                                            onClick={() => {
                                                setIsChangelogVisible(true);
                                                setShowUpdateNotification(false);
                                            }}
                                            className="underline font-bold ml-2 hover:text-white"
                                        >
                                            See what's new.
                                        </button>
                                    </span>
                                    <button onClick={() => setShowUpdateNotification(false)} className="text-blue-300 hover:text-white text-2xl leading-none px-2">&times;</button>
                                </div>
                            )}

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
                                <div className="bg-purple-900/50 border-2 border-dashed border-purple-500/60 p-5 rounded-lg mb-6">
                                    <div className="text-center mb-4">
                                        <h3 className="text-xl font-bold text-purple-200">Custom Rune Calculator</h3>
                                        <p className="text-sm text-purple-300 mt-1">For new or unlisted runes.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="flex-1 text-center sm:text-left">
                                            <label htmlFor="custom-chance" className="block text-sm font-medium text-purple-200 mb-1">Enter Rune Chance (1 in...)</label>
                                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                <input id="custom-chance" type="text" value={customRuneChance} onChange={(e) => setCustomRuneChance(e.target.value)} className="bg-gray-700/80 text-white p-2 rounded-md border border-gray-600 focus:border-cyan-500 w-40 text-center" placeholder="e.g., 1e300" />
                                                <span className="text-gray-400 text-sm">{customRuneConversion}</span>
                                            </div>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <p className="text-sm text-purple-200 mb-1">Calculated Time</p>
                                            <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-lg font-semibold px-4 py-2 rounded-lg min-w-[150px]">
                                                {formatTime(customRuneDetails.time)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {processedRunes.map((rune) => {
                                    const isNextUpgrade = rune.name === nextUpgradeName;
                                    const highlightClass = isNextUpgrade ? 'border-yellow-400 shadow-yellow-400/20 shadow-lg' : 'border-gray-700';
                                    const isSpecialChance = typeof rune.chance === 'object';

                                    return (
                                        <div key={rune.name} className={`bg-gray-900/50 backdrop-blur-sm p-5 rounded-lg shadow-md border transition-all duration-300 ${highlightClass}`}>
                                            {isNextUpgrade && <div className="text-yellow-400 font-bold mb-2 text-sm">Next Target (&lt; 1 Hour)</div>}
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                        <h2 className="text-2xl font-bold text-white">{rune.name}</h2>
                                                        {rune.tags && rune.tags.map(tag => <RuneTag key={tag} tag={tag} />)}
                                                    </div>
                                                    <p className="text-sm text-gray-400">{rune.source}</p>
                                                    <p className="text-sm text-cyan-400">{formatChance(rune)}</p>
                                                    <div className="mt-3 bg-gray-800/50 p-3 rounded-lg space-y-2 min-h-[8rem]">
                                                        <h4 className="font-semibold text-green-400">Bonuses:</h4>
                                                        {rune.bonuses && rune.bonuses
                                                            .filter(bonus => typeof bonus.value === 'number')
                                                            .map((bonus, index) => (
                                                                <BonusDisplay key={index} bonus={bonus} formatNumber={formatNumber} />
                                                            ))}
                                                    </div>
                                                </div>
                                                <div className={`text-lg font-semibold px-4 py-2 rounded-lg text-center w-full sm:w-auto min-w-[150px] ${isSpecialChance ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'}`}>
                                                    {isSpecialChance ? 'Special Cost' : formatTime(rune.time)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {activeTab === 'timetomax' && appData.status === 'loaded' && (
                        <TimeToMaxCalculator
                            runesData={appData.runes}
                            parseRpsInput={parseRpsInput}
                            formatTime={formatTime}
                            formatNumber={formatNumber}
                            syncedState={syncedState}
                            setSyncedState={setSyncedState}
                        />
                    )}
                    {activeTab === 'timetox' && appData.status === 'loaded' && (
                        <TimeToXCalculator
                            runesData={appData.runes}
                            parseRpsInput={parseRpsInput}
                            formatTime={formatTime}
                            formatNumber={formatNumber}
                            syncedState={syncedState}
                            setSyncedState={setSyncedState}
                        />
                    )}
                    {activeTab === 'whatif' && appData.status === 'loaded' && (
                        <TargetCalculator runesData={appData.runes} formatNumber={formatNumber} />
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
