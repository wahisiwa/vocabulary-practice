
import React, { useState, useEffect, useCallback } from 'react';
import { TestMode, WordPair, TestResult } from './types';
import { WORD_LIST } from './constants';
import { Layout } from './components/Layout';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getRank = (score: number): string => {
  if (score === 100) return 'S';
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 50) return 'C';
  return 'D';
};

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<TestMode | null>(null);
  const [shuffledList, setShuffledList] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const startTest = (mode: TestMode) => {
    setCurrentMode(mode);
    setShuffledList(shuffleArray(WORD_LIST));
    setCurrentIndex(0);
    setCorrectCount(0);
    setShowAnswer(false);
    setResult(null);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < shuffledList.length) {
      setCurrentIndex(nextIndex);
      setShowAnswer(false);
    } else {
      const finalCorrectCount = isCorrect ? correctCount + 1 : correctCount;
      const score = Math.round((finalCorrectCount / shuffledList.length) * 100);
      setResult({
        correct: finalCorrectCount,
        total: shuffledList.length,
        rank: getRank(score),
        score: score
      });
    }
  };

  const resetTest = () => {
    setCurrentMode(null);
    setResult(null);
  };

  // Home Screen
  if (!currentMode) {
    return (
      <Layout>
        <div className="space-y-8 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">モードを選択してください</h2>
            <p className="text-slate-500">全部で {WORD_LIST.length} 問あります</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => startTest(TestMode.EN_TO_JP)}
              className="flex flex-col items-center justify-center p-8 bg-indigo-50 border-2 border-indigo-100 rounded-2xl hover:bg-indigo-100 hover:border-indigo-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-language"></i>
              </div>
              <span className="font-bold text-indigo-900">EN → JP</span>
              <span className="text-xs text-indigo-600 mt-1">英単語を見て日本語を答える</span>
            </button>

            <button
              onClick={() => startTest(TestMode.JP_TO_EN)}
              className="flex flex-col items-center justify-center p-8 bg-emerald-50 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-100 hover:border-emerald-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <i className="fas fa-font"></i>
              </div>
              <span className="font-bold text-emerald-900">JP → EN</span>
              <span className="text-xs text-emerald-600 mt-1">日本語を見て英単語を答える</span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Result Screen
  if (result) {
    return (
      <Layout>
        <div className="text-center space-y-8 animate-bounceIn">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-800">テスト終了！</h2>
            <div className="relative inline-block">
              <div className="text-8xl font-black text-indigo-600 mb-2">{result.rank}</div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                RANK
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-600 font-medium">正解数</span>
              <span className="text-2xl font-bold text-slate-900">{result.correct} / {result.total}</span>
            </div>
            <div className="flex justify-between items-center text-lg border-t border-slate-200 pt-3">
              <span className="text-slate-600 font-medium">正解率</span>
              <span className="text-2xl font-bold text-indigo-600">{result.score}%</span>
            </div>
          </div>

          <button
            onClick={resetTest}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-3"
          >
            <i className="fas fa-redo"></i>
            タイトルに戻る
          </button>
        </div>
      </Layout>
    );
  }

  // Test Screen
  const currentWord = shuffledList[currentIndex];
  const question = currentMode === TestMode.EN_TO_JP ? currentWord.en : currentWord.jp;
  const answer = currentMode === TestMode.EN_TO_JP ? currentWord.jp : currentWord.en;
  const progress = ((currentIndex) / shuffledList.length) * 100;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold text-slate-400">
            <span>QUESTION {currentIndex + 1}</span>
            <span>{currentIndex + 1} / {shuffledList.length}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="min-h-[240px] flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-3xl shadow-inner text-center">
          <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">
            {currentMode === TestMode.EN_TO_JP ? 'English' : 'Japanese'}
          </div>
          <h3 className="text-5xl font-bold text-slate-800 break-words w-full">
            {question}
          </h3>
          
          <div className={`mt-8 transition-all duration-500 ${showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
              Correct Answer
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {showAnswer ? answer : '?'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95"
            >
              答えを表示する
            </button>
          ) : (
            <div className="flex gap-4 animate-fadeIn">
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fas fa-times-circle text-xl"></i>
                間違えた
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fas fa-check-circle text-xl"></i>
                合っている
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={resetTest}
          className="w-full text-slate-400 hover:text-rose-500 text-sm font-medium transition-colors pt-4"
        >
          テストを中止して戻る
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </Layout>
  );
};

export default App;
