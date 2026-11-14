import React, { useState } from 'react';
import {
  Wrench,
  Play,
  Check,
  Copy,
  Terminal,
  Code2,
  FileJson,
  Scale,
  Sparkles,
} from 'lucide-react';

export const ToolboxView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'sandbox' | 'regex' | 'json' | 'converter' | 'summarizer'>('sandbox');

  // --- 1. Sandbox State ---
  const [code, setCode] = useState(`// Local JavaScript Offline Sandbox
const numbers = [12, 45, 68, 92, 104];
const sum = numbers.reduce((acc, n) => acc + n, 0);
const average = sum / numbers.length;

console.log("Input Array:", numbers);
console.log("Calculated Sum:", sum);
console.log("Average:", average);
`);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);

  const runCode = () => {
    setOutputLogs([]);
    setHasError(false);
    const logs: string[] = [];

    // Temporary console interception
    const originalLog = console.log;
    const originalError = console.error;

    try {
      console.log = (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      };
      console.error = (...args: any[]) => {
        logs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      };

      // Execute safely in isolated scope
      // eslint-disable-next-line no-new-func
      const runner = new Function(code);
      runner();

      setOutputLogs(logs.length > 0 ? logs : ['Code executed successfully with 0 output logs.']);
    } catch (e: any) {
      setHasError(true);
      setOutputLogs([`Runtime Exception: ${e.message}`]);
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  };

  // --- 2. Regex State ---
  const [regexPattern, setRegexPattern] = useState('([A-Z0-9._%+-]+)@([A-Z0-9.-]+\\.[A-Z]{2,})');
  const [regexFlags, setRegexFlags] = useState('gi');
  const [regexText, setRegexText] = useState(
    'Contact the executive desk at mwskkashikhan@gmail.com or support@mrmwsk.ai for encrypted inquiries.'
  );

  let regexMatches: Array<{ match: string; index: number; groups: string[] }> = [];
  let regexError = '';
  try {
    const reg = new RegExp(regexPattern, regexFlags);
    const results = Array.from(regexText.matchAll(reg));
    regexMatches = results.map((r) => ({
      match: r[0],
      index: r.index ?? 0,
      groups: r.slice(1),
    }));
  } catch (err: any) {
    regexError = err.message;
  }

  // --- 3. JSON Tool State ---
  const [jsonInput, setJsonInput] = useState(`{
  "system": "MrMWSK's Ai",
  "version": 1.0,
  "offlineReady": true,
  "connectors": ["gemini", "webhook", "ical"]
}`);
  const [jsonStatus, setJsonStatus] = useState<string | null>(null);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setJsonStatus('Successfully formatted valid JSON');
    } catch (e: any) {
      setJsonStatus(`Invalid JSON: ${e.message}`);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed));
      setJsonStatus('Successfully minified JSON');
    } catch (e: any) {
      setJsonStatus(`Invalid JSON: ${e.message}`);
    }
  };

  // --- 4. Unit Converter State ---
  const [convertType, setConvertType] = useState<'distance' | 'temp' | 'data' | 'weight'>('distance');
  const [convValue, setConvValue] = useState<number>(100);

  const getConversions = () => {
    switch (convertType) {
      case 'distance':
        return [
          { label: 'Kilometers', val: (convValue * 1.60934).toFixed(3) + ' km' },
          { label: 'Meters', val: (convValue * 1609.34).toFixed(1) + ' m' },
          { label: 'Feet', val: (convValue * 5280).toFixed(0) + ' ft' },
          { label: 'Nautical Miles', val: (convValue * 0.868976).toFixed(3) + ' NM' },
        ];
      case 'temp':
        return [
          { label: 'Fahrenheit', val: ((convValue * 9) / 5 + 32).toFixed(1) + ' °F' },
          { label: 'Kelvin', val: (convValue + 273.15).toFixed(2) + ' K' },
        ];
      case 'data':
        return [
          { label: 'Gigabytes (GB)', val: (convValue / 1024).toFixed(3) + ' GB' },
          { label: 'Kilobytes (KB)', val: (convValue * 1024).toFixed(0) + ' KB' },
          { label: 'Bytes', val: (convValue * 1024 * 1024).toLocaleString() + ' B' },
        ];
      case 'weight':
        return [
          { label: 'Pounds (lbs)', val: (convValue * 2.20462).toFixed(2) + ' lbs' },
          { label: 'Grams (g)', val: (convValue * 1000).toLocaleString() + ' g' },
          { label: 'Ounces (oz)', val: (convValue * 35.274).toFixed(2) + ' oz' },
        ];
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-950/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Wrench className="w-4 h-4" />
            <span>Air-Gapped Client Utilities</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Offline Engineering Toolbox
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Suite of zero-latency, private utility engines that run 100% locally in your browser.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTool('sandbox')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTool === 'sandbox' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Code Sandbox
          </button>
          <button
            onClick={() => setActiveTool('regex')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTool === 'regex' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Regex Lab
          </button>
          <button
            onClick={() => setActiveTool('json')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTool === 'json' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            JSON Formatter
          </button>
          <button
            onClick={() => setActiveTool('converter')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTool === 'converter' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Converter
          </button>
        </div>
      </div>

      {/* Tool 1: Code Sandbox */}
      {activeTool === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>JavaScript Executor</span>
                </span>
                <button
                  onClick={runCode}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Script</span>
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Console Output</span>
            </span>

            <div
              className={`flex-1 p-4 rounded-xl font-mono text-xs overflow-y-auto ${
                hasError ? 'bg-rose-950/20 text-rose-300 border border-rose-900' : 'bg-slate-950 text-emerald-400 border border-slate-800'
              }`}
            >
              {outputLogs.length > 0 ? (
                outputLogs.map((log, idx) => (
                  <div key={idx} className="py-0.5">
                    {log}
                  </div>
                ))
              ) : (
                <span className="text-slate-600">// Click &quot;Run Script&quot; to execute code locally</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: Regex Lab */}
      {activeTool === 'regex' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">Regex Pattern</label>
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Flags</label>
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Test String</label>
              <textarea
                rows={4}
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {regexError && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900 text-xs text-rose-300">
                Pattern syntax error: {regexError}
              </div>
            )}

            <div>
              <div className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <span>Evaluated Matches:</span>
                <span className="font-mono text-amber-400 tabular-nums">({regexMatches.length})</span>
              </div>

              <div className="space-y-2">
                {regexMatches.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                    <span className="text-emerald-400 font-bold">Match #{idx + 1}:</span> &quot;{m.match}&quot; at index {m.index}
                    {m.groups.length > 0 && (
                      <div className="mt-1 text-slate-400 pl-4 border-l border-slate-800">
                        {m.groups.map((g, gIdx) => (
                          <div key={gIdx}>Group {gIdx + 1}: &quot;{g}&quot;</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool 3: JSON Formatter */}
      {activeTool === 'json' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>JSON Synthesizer</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={formatJson}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
              >
                Prettify JSON
              </button>
              <button
                onClick={minifyJson}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Minify JSON
              </button>
            </div>
          </div>

          <textarea
            rows={12}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500"
          />

          {jsonStatus && (
            <div className="text-xs text-slate-400 font-mono">
              {jsonStatus}
            </div>
          )}
        </div>
      )}

      {/* Tool 4: Metric & Unit Converter */}
      {activeTool === 'converter' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Converter Dimension:</span>
            </span>

            <select
              value={convertType}
              onChange={(e) => setConvertType(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="distance">Distance & Length (Miles, KM)</option>
              <option value="temp">Temperature (Celsius, Fahrenheit)</option>
              <option value="data">Digital Storage (MB, GB, Bytes)</option>
              <option value="weight">Mass & Weight (KG, Pounds)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Input Value</label>
              <input
                type="number"
                value={convValue}
                onChange={(e) => setConvValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Equivalents</label>
              <div className="grid grid-cols-2 gap-2">
                {getConversions().map((c, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="text-[10px] text-slate-400">{c.label}</div>
                    <div className="text-sm font-bold text-white font-mono tabular-nums">{c.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
