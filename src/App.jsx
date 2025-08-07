import React, { useState, useMemo, useEffect, useRef } from 'react';

// --- App Info & Data ---
const version = '1.1.0';
const guideLink = 'https://docs.google.com/spreadsheets/d/1FWuPcp1QvIn-TAJkD1nRPtZnVwotBHcqR17xOR8SkHg/htmlview?gid=623912504#gid=539880323';

const changelog = [
    {
        version: '1.1.0',
        date: '2025-08-06',
        changes: [
            'Major UI Overhaul: Replaced the long stat string with a formatted, icon-driven bonus list.',
            'Data is now fetched live from the official GitHub repository.',
            'Added humorous messages for extremely long wait times (>100 years).',
            'Made bonus display boxes responsive and uniform for a better mobile experience.'
        ]
    },
    { version: '1.0.18', date: '2025-08-05', changes: ['Updated stats for the Constellation rune.'] },
    { version: '1.0.17', date: '2025-08-05', changes: ['Added Onyx, Strix, Liberty, Rocket, and Vanguard runes.'] },
    { version: '1.0.16', date: '2025-08-04', changes: ['Added Cosmic Dust, Star, Apex, Constellation, and Torrent runes.'] },
    { version: '1.0.15', date: '2025-08-03', changes: ['Added Whirl and Riptide runes.'] },
    { version: '1.0.14', date: '2025-08-03', changes: ['Redesigned the custom rune calculator to be more distinct and less confusing for new players.', 'Added more explanatory text for its purpose.'] },
    { version: '1.0.13', date: '2025-08-03', changes: ['Enhanced the custom rune input to act as a two-way converter between short-form and scientific notation.'] },
    { version: '1.0.12', date: '2025-08-03', changes: ['Added a custom rune calculator for unlisted or new runes.'] },
    { version: '1.0.11', date: '2025-08-03', changes: ['Added a prominent link to the comprehensive Google Docs guide.', 'Clarified the "Next Upgrade" text to be more intuitive.', 'Updated note links to be functional.'] },
    { version: '1.0.10', date: '2025-08-02', changes: ['Updated stats for Bolt and Zephyr runes.'] },
    { version: '1.0.9', date: '2025-08-02', changes: ['Re-implemented the "What\'s New" notification feature.'] },
    { version: '1.0.8', date: '2025-08-02', changes: ['Added Bolt and Zephyr runes.', 'Corrected chances for Triarch, Disarray, and Abyssium.', 'Fixed typos in stat descriptions.'] },
    { version: '1.0.7', date: '2025-08-02', changes: ['Added the Triarch and Disarray runes.'] },
    { version: '1.0.6', date: '2025-08-02', changes: ['Added a "What\'s New" notification banner that appears when the app is updated.'] },
    { version: '1.0.5', date: '2025-08-02', changes: ['Added case-sensitive handling for ambiguous number suffixes (e.g., Tqg vs TQg) with a user warning.'] },
    { version: '1.0.4', date: '2025-08-01', changes: ['Updated the sources for Hyper Finality, Shyft, Array, and Stray runes.'] },
    { version: '1.0.3', date: '2025-08-01', changes: ['Added the Stray rune.'] },
    { version: '1.0.2', date: '2025-08-01', changes: ['Added a clarifying line to note that times are for a single rune.'] },
    { version: '1.0.1', date: '2025-08-01', changes: ['Corrected the chance for the Vanta rune.'] },
    { version: '1.0.0', date: '2025-08-01', changes: ['Added versioning and a changelog.', 'Improved styling for rune descriptions.', 'Added a message to report incorrect values.', 'Made RPS input parsing case-insensitive.'] },
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

// --- Custom Components ---
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
                    {runesData.filter(r => typeof r.chance === 'number').map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
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
// NOTE: Make sure to add this script to your index.html for the icons to work:
// <script src="https://unpkg.com/lucide@latest"></script>
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
        // Lucide's script finds all `[data-lucide]` elements and replaces them with SVG icons.
        // We need to re-run this after React renders the new `<i>` elements.
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
    const [rawRpsInput, setRawRpsInput] = useState('1M');
    const [hideInstant, setHideInstant] = useState(true);
    const [sortOrder, setSortOrder] = useState('asc');
    const [runeFilter, setRuneFilter] = useState('');
    const [customRuneChance, setCustomRuneChance] = useState('1e300');
    const [isChangelogVisible, setIsChangelogVisible] = useState(false);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);

    const debounceTimeoutRef = useRef(null);
    const rpsDebounceTimeoutRef = useRef(null);
    const isInitialMount = useRef(true);

    // Effect to fetch data from external GitHub links
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Define fetch options to disable caching
                const fetchOptions = { cache: 'no-store' };
                // Generate a unique value for the query parameter
                const cacheBuster = `?v=${Date.now()}`;

                const [runesResponse, scalesResponse] = await Promise.all([
                    fetch(`https://raw.githubusercontent.com/truthuntold/ai-rune-calc/refs/heads/main/public/runes.json${cacheBuster}`),
                    fetch(`https://raw.githubusercontent.com/truthuntold/ai-rune-calc/refs/heads/main/public/scales.json${cacheBuster}`)
                ]);
                if (!runesResponse.ok || !scalesResponse.ok) {
                    throw new Error('Network response was not ok');
                }
                const runes = await runesResponse.json();
                const scales = await scalesResponse.json();

                setAppData({ runes, scales, status: 'loaded', error: null });
            } catch (error) {
                console.error("Failed to fetch data from GitHub.", error);
                setAppData({ runes: [], scales: {}, status: 'error', error: 'Failed to load data from GitHub. Please check your connection and try again.' });
            }
        };
        fetchData();
    }, []);

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

    useEffect(() => {
        const savedRps = localStorage.getItem('runeCalc_rawRpsInput');
        if (savedRps) setRawRpsInput(savedRps);

        const lastVisitedVersion = localStorage.getItem('runeCalc_lastVisitedVersion');
        if (lastVisitedVersion && lastVisitedVersion !== version) {
            setShowUpdateNotification(true);
        }
        localStorage.setItem('runeCalc_lastVisitedVersion', version);
    }, []);

    useEffect(() => {
        localStorage.setItem('runeCalc_rawRpsInput', rawRpsInput);
    }, [rawRpsInput]);

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

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            if (nextUpgradeName) {
                trackEvent('next_target_rune_selected', { rune_name: nextUpgradeName });
            }
        }, 1000);
        return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
    }, [nextUpgradeName]);

    useEffect(() => {
        if (isInitialMount.current) return;
        if (rpsDebounceTimeoutRef.current) clearTimeout(rpsDebounceTimeoutRef.current);
        rpsDebounceTimeoutRef.current = setTimeout(() => {
            if (rps > 0 && !rpsWarning) {
                trackEvent('rps_value_set', { value: rps });
            }
        }, 1000);
        return () => { if (rpsDebounceTimeoutRef.current) clearTimeout(rpsDebounceTimeoutRef.current); };
    }, [rps, rpsWarning]);

    const TabButton = ({ tabName, label }) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-colors duration-300 ${isActive
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
                    <p className="text-lg text-gray-400">A strategic tool for planning your progression. Times shown are for a single rune. <span className="text-xs text-gray-500">v{version}</span></p>
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


                <div className="flex border-b border-gray-700 mb-0">
                    <TabButton tabName="calculator" label="Rune Calculator" />
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
