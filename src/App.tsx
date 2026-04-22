/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Copy, Check, Sparkles, RefreshCcw, BookMarked, HelpCircle, GraduationCap, FileText, Upload, Settings, X, Key } from 'lucide-react';
import { generateQuiz, QuizResult, QuizQuestion } from './lib/gemini';
import { extractTextFromFile } from './lib/fileProcessor';

export default function App() {
  const [passage, setPassage] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [contextAnswers, setContextAnswers] = useState<string[]>([]);
  const [newAnswers, setNewAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [copiedContext, setCopiedContext] = useState(false);
  const [copiedNew, setCopiedNew] = useState(false);

  // API Key Settings
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setUserApiKey(savedKey);
      setKeyInput(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('user_gemini_api_key', keyInput);
    setUserApiKey(keyInput);
    setShowSettings(false);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setPassage(text);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!passage.trim()) return;
    setLoading(true);
    try {
      const quizResult = await generateQuiz(passage, userApiKey);
      if (quizResult && !('error' in quizResult)) {
        setResult(quizResult);
        setContextAnswers(new Array(quizResult.contextQuestions.length).fill(''));
        setNewAnswers(new Array(quizResult.newSentenceQuestions.length).fill(''));
        setShowResults(false);
      } else {
        alert('Failed to generate quiz. Please check your API key.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (questions: QuizQuestion[], type: 'context' | 'new') => {
    const text = questions.map((q, i) => `${i + 1}. ${q.sentenceBefore}____${q.sentenceAfter}`).join('\n');
    await navigator.clipboard.writeText(text);
    if (type === 'context') {
      setCopiedContext(true);
      setTimeout(() => setCopiedContext(false), 2000);
    } else {
      setCopiedNew(true);
      setTimeout(() => setCopiedNew(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-ink font-sans selection:bg-natural-pink flex flex-col">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-natural-ink/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-natural-beige p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold text-natural-olive flex items-center gap-2">
                  <Key size={20} />
                  API Key Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-natural-grey hover:text-natural-olive transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-natural-grey leading-relaxed">
                If you have your own Google Gemini API key, enter it here. This will be stored securely in your browser and used for quiz generation.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-natural-grey">Gemini API Key</label>
                <input 
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full px-5 py-3 bg-natural-bg rounded-xl border border-natural-beige focus:ring-2 focus:ring-natural-lime outline-none font-mono text-sm"
                />
              </div>
              <button 
                onClick={handleSaveKey}
                className="w-full py-4 bg-natural-olive text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-md"
              >
                Save & Use My Key
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('user_gemini_api_key');
                  setUserApiKey('');
                  setKeyInput('');
                  setShowSettings(false);
                }}
                className="w-full py-2 text-[10px] font-bold text-natural-grey hover:text-natural-pink transition-colors uppercase tracking-widest"
              >
                Reset to Default
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto w-full flex-1 p-6 md:p-12 md:border-x-8 md:border-natural-grey space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-natural-beige relative">
          <div className="space-y-1">
            <h1 className="text-4xl font-serif font-bold text-natural-olive tracking-tight">E-Quiz Maker Pro</h1>
            <p className="text-sm text-natural-grey italic uppercase tracking-[0.2em] font-medium">Dual-Mode Vocabulary Assistant</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(true)}
              className={`p-3 rounded-xl border transition-all ${userApiKey ? 'border-natural-accent text-natural-accent bg-natural-accent/5' : 'border-natural-beige text-natural-grey hover:bg-white hover:shadow-sm'}`}
              title="Settings"
            >
              <Settings size={20} className={userApiKey ? 'animate-pulse-slow' : ''} />
            </button>
            <div className="hidden md:flex gap-4">
              <div className="px-5 py-2 rounded-full border border-natural-accent text-xs font-bold text-natural-accent uppercase tracking-wider">
                Interactive Edition
              </div>
              <div className="px-5 py-2 bg-natural-olive text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2">
                <Sparkles size={14} />
                AI Educator
              </div>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Left Panel: Input */}
          <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-natural-olive flex items-center gap-2">
                < BookOpen size={16} />
                Reading Source
              </h2>
              <div className="flex gap-2">
                <label className={`cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-natural-beige bg-white hover:bg-natural-bg transition-all ${extracting ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} disabled={extracting} />
                  {extracting ? <RefreshCcw size={14} className="animate-spin text-natural-grey" /> : <Upload size={14} className="text-natural-grey group-hover:text-natural-olive" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-natural-grey group-hover:text-natural-olive">Upload PDF/TXT</span>
                </label>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 gap-4">
              <div className="relative group flex-1">
                <textarea
                  className="w-full h-80 lg:h-[600px] p-8 bg-white rounded-3xl border border-natural-beige shadow-inner focus:ring-4 focus:ring-natural-lime/30 focus:border-natural-olive transition-all outline-none resize-y text-lg leading-relaxed font-serif text-natural-ink/80"
                  placeholder="Paste English passage here or upload a file..."
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                />
                {passage && (
                  <button 
                    onClick={() => setPassage('')}
                    className="absolute top-4 right-4 p-2 bg-natural-bg/50 hover:bg-natural-pink/20 rounded-full text-natural-grey hover:text-natural-pink transition-all"
                    title="Clear Text"
                  >
                    <RefreshCcw size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !passage.trim()}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 transition-all shadow-md active:scale-95 ${
                  loading || !passage.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                    : 'bg-natural-olive text-white hover:brightness-110'
                }`}
              >
                {loading ? <RefreshCcw size={20} className="animate-spin" /> : <span>Generate All Quizzes</span>}
              </button>
              {userApiKey && (
                <p className="text-[9px] text-center text-natural-accent font-bold uppercase tracking-widest animate-pulse">
                  Using Custom API Key
                </p>
              )}
            </div>
          </section>

          {/* Right Panel: Multiple Quizzes */}
          <section className="col-span-12 lg:col-span-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-20 text-natural-grey space-y-4">
                  <RefreshCcw size={48} className="animate-spin" />
                  <p className="font-serif italic text-lg">Generating two types of vocabulary assessments...</p>
                </motion.div>
              ) : result ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  {/* Vocabulary Guide - Always at top */}
                  <div className="bg-white/50 border border-natural-beige p-6 rounded-2xl flex flex-wrap gap-3 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-natural-grey mr-2 border-r pr-4 border-natural-beige">Target Vocabulary</span>
                    {result.keyVocabulary.map((item, idx) => (
                      <div key={idx} className="group relative">
                        <span className="px-3 py-1.5 bg-natural-lime/30 text-natural-ink rounded-lg text-xs font-bold border border-natural-olive/10 cursor-help hover:bg-natural-lime transition-all">
                          {item.word}
                        </span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-natural-ink text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                          {item.meaning}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quiz A: Context-based */}
                  <QuizSection 
                    title="Quiz A: Context-based" 
                    subtitle="Based on the original passage"
                    questions={result.contextQuestions}
                    userAnswers={contextAnswers}
                    setUserAnswers={setContextAnswers}
                    showResults={showResults}
                    onCopy={() => copyToClipboard(result.contextQuestions, 'context')}
                    copied={copiedContext}
                  />

                  {/* Quiz B: New Sentences */}
                  < QuizSection 
                    title="Quiz B: New Sentences" 
                    subtitle="Applied to new contexts"
                    questions={result.newSentenceQuestions}
                    userAnswers={newAnswers}
                    setUserAnswers={setNewAnswers}
                    showResults={showResults}
                    onCopy={() => copyToClipboard(result.newSentenceQuestions, 'new')}
                    copied={copiedNew}
                  />

                  {/* Shared Controls */}
                  <div className="flex flex-col gap-6">
                    {!showResults ? (
                      <button onClick={() => setShowResults(true)} className="w-full py-5 bg-natural-olive text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-xl transition-all">
                        Check All Answers
                      </button>
                    ) : (
                      <div className="flex gap-4">
                         <button 
                          onClick={() => {
                            setShowResults(false);
                            setContextAnswers(new Array(result.contextQuestions.length).fill(''));
                            setNewAnswers(new Array(result.newSentenceQuestions.length).fill(''));
                          }} 
                          className="flex-1 py-5 border-2 border-natural-olive text-natural-olive rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-natural-bg transition-all"
                        >
                          Reset & Retake
                        </button>
                        <div className="flex-1 bg-natural-hightlight p-4 rounded-2xl border border-natural-grey/30 flex items-center justify-center gap-4">
                           <div className="text-[10px] font-black uppercase text-natural-grey">Overall Score:</div>
                           <div className="text-3xl font-serif font-black text-natural-olive">
                            {[...contextAnswers, ...newAnswers].filter((ans, i) => {
                              const allQ = [...result.contextQuestions, ...result.newSentenceQuestions];
                              return ans.trim().toLowerCase() === allQ[i].correctAnswer.toLowerCase();
                            }).length} / {result.contextQuestions.length + result.newSentenceQuestions.length}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center px-8 text-center bg-natural-beige/10 rounded-[40px] border border-dashed border-natural-beige p-20">
                  <div className="max-w-sm space-y-6">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto text-natural-beige shadow-sm scale-110">
                      <HelpCircle size={48} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-serif font-bold text-natural-olive tracking-tight">Ready for Assessment?</h3>
                      <p className="text-sm text-natural-grey leading-relaxed italic px-6">
                        Paste your text to generate both context-based and randomized usage quizzes with interactive grading.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </section>
        </main>

        <footer className="flex flex-col md:flex-row items-center justify-between text-[10px] text-natural-grey uppercase tracking-[0.2em] font-medium pt-8 border-t border-natural-beige">
          <span>Academic Year 2026/27</span>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>Teacher Resource Hub</span>
            <span>Difficulty: Automatic (B2+)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function QuizSection({ title, subtitle, questions, userAnswers, setUserAnswers, showResults, onCopy, copied }: any) {
  return (
    <div className="bg-white rounded-3xl border-2 border-natural-olive shadow-xl p-8 relative overflow-hidden">
      <div className="absolute -top-1 -right-1">
        <div className="bg-natural-olive text-white px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-2xl">
          {title}
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-10">
        <div className="space-y-1">
          <h4 className="font-serif italic text-xl text-natural-olive">{title}</h4>
          <p className="text-[10px] uppercase font-bold text-natural-grey tracking-widest">{subtitle}</p>
        </div>
        <button onClick={onCopy} className="p-3 bg-natural-bg rounded-xl hover:brightness-95 transition-all text-natural-grey hover:text-natural-olive flex items-center gap-2">
          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          <span className="text-[10px] font-black uppercase tracking-wider">{copied ? 'Copied!' : 'Copy Quiz Text'}</span>
        </button>
      </div>

      <div className="space-y-10">
        {questions.map((q: any, idx: number) => {
          const isCorrect = userAnswers[idx]?.trim().toLowerCase() === q.correctAnswer.toLowerCase();
          return (
            <div key={idx} className="space-y-3">
               <div className="flex flex-wrap items-baseline gap-x-2 gap-y-4 text-lg font-serif leading-relaxed text-natural-ink/90">
                <span className="font-serif italic text-natural-grey mr-2">{idx + 1}.</span>
                <span>{q.sentenceBefore}</span>
                <input
                  type="text"
                  value={userAnswers[idx] || ''}
                  onChange={(e) => {
                    const newAns = [...userAnswers];
                    newAns[idx] = e.target.value;
                    setUserAnswers(newAns);
                  }}
                  disabled={showResults}
                  className={`min-w-[120px] px-2 py-0.5 border-b-2 bg-transparent outline-none transition-all text-center font-bold font-sans ${
                    showResults 
                      ? isCorrect ? 'border-green-500 text-green-700' : 'border-red-400 text-red-600'
                      : 'border-natural-ink focus:border-natural-accent focus:bg-natural-pink/10'
                  }`}
                  placeholder="..."
                />
                <span>{q.sentenceAfter}</span>
              </div>
              {showResults && !isCorrect && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold text-green-600 pl-8 flex items-center gap-1">
                  <Check size={12} />
                  Answer: {q.correctAnswer}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

