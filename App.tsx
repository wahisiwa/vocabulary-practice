
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

const getSpeakableText = (text: string): string => {
  return text.replace(/[〜~]/g, '').replace(/\s+/g, ' ').trim();
};

const getEnglishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
  return (
    voices.find(voice => voice.lang.toLowerCase().startsWith('en-us')) ||
    voices.find(voice => voice.lang.toLowerCase().startsWith('en'))
  );
};

interface ReadingPillProps {
  reading: string;
}

const ReadingPill: React.FC<ReadingPillProps> = ({ reading }) => {
  return (
    <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm sm:text-base font-bold text-slate-600 shadow-sm">
      {reading}
    </div>
  );
};

interface PronunciationButtonProps {
  word: WordPair;
  canSpeak: boolean;
  onSpeak: (word: WordPair) => void;
}

const PronunciationButton: React.FC<PronunciationButtonProps> = ({ word, canSpeak, onSpeak }) => {
  return (
    <button
      type="button"
      onClick={() => onSpeak(word)}
      disabled={!canSpeak}
      aria-label={`${word.en} の発音を再生`}
      title={canSpeak ? '英語の発音を再生' : 'このブラウザは音声再生に対応していません'}
      className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-indigo-600 text-base text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
    >
      <i className="fas fa-volume-high"></i>
    </button>
  );
};

interface WordListSectionProps {
  canSpeak: boolean;
  speechError: string | null;
  onSpeak: (word: WordPair) => void;
}

const WordListSection: React.FC<WordListSectionProps> = ({ canSpeak, speechError, onSpeak }) => {
  return (
    <section className="border-t border-slate-200 pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <i className="fas fa-list text-slate-500"></i>
          単語一覧
        </h3>
        <span className="text-sm font-bold text-slate-400">{WORD_LIST.length}語</span>
      </div>

      {speechError && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold leading-relaxed text-rose-600">
          {speechError}
        </p>
      )}

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {WORD_LIST.map(word => (
          <div key={word.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 flex-none text-right text-sm font-bold text-slate-300">
              {word.id}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-base font-bold text-slate-800">{word.en}</span>
                <span className="text-sm font-bold text-slate-500">{word.jp}</span>
              </div>
              <div className="mt-1 text-xs font-medium text-slate-400">
                {word.reading}
              </div>
            </div>
            <PronunciationButton word={word} canSpeak={canSpeak} onSpeak={onSpeak} />
          </div>
        ))}
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<TestMode | null>(null);
  const [shuffledList, setShuffledList] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      setSpeechVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakWord = useCallback((word: WordPair) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechError('このブラウザは音声再生に対応していません。');
      return;
    }

    setSpeechError(null);
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(getSpeakableText(word.en));
    const englishVoice = getEnglishVoice(speechVoices);

    if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = englishVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onerror = () => {
      setSpeechError('音声を再生できませんでした。SafariやChromeで開き直すか、端末の音量設定を確認してください。');
    };

    const play = () => {
      synth.speak(utterance);
      if (synth.paused) {
        synth.resume();
      }
    };

    if (synth.speaking || synth.pending) {
      synth.cancel();
      window.setTimeout(play, 80);
    } else {
      play();
    }
  }, [speechVoices]);

  const startTest = (mode: TestMode) => {
    setCurrentMode(mode);
    // QUIZ mode uses only 10 random words
    const wordList = mode === TestMode.QUIZ_EN_TO_JP || mode === TestMode.QUIZ_JP_TO_EN
      ? shuffleArray(WORD_LIST).slice(0, 10)
      : shuffleArray(WORD_LIST);
    setShuffledList(wordList);
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
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                <i className="fas fa-book text-indigo-600"></i>
                フルテスト
              </h3>
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

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                <i className="fas fa-clipboard-check text-rose-600"></i>
                確認テスト (10問)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => startTest(TestMode.QUIZ_EN_TO_JP)}
                  className="flex flex-col items-center justify-center p-8 bg-rose-50 border-2 border-rose-100 rounded-2xl hover:bg-rose-100 hover:border-rose-200 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-rose-600 text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <span className="font-bold text-rose-900">EN → JP</span>
                  <span className="text-xs text-rose-600 mt-1">ランダム10問</span>
                </button>

                <button
                  onClick={() => startTest(TestMode.QUIZ_JP_TO_EN)}
                  className="flex flex-col items-center justify-center p-8 bg-amber-50 border-2 border-amber-100 rounded-2xl hover:bg-amber-100 hover:border-amber-200 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-amber-600 text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <span className="font-bold text-amber-900">JP → EN</span>
                  <span className="text-xs text-amber-600 mt-1">ランダム10問</span>
                </button>
              </div>
            </div>
          </div>

          <WordListSection canSpeak={canSpeak} speechError={speechError} onSpeak={speakWord} />
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
  const isEnglishQuestion = currentMode === TestMode.EN_TO_JP || currentMode === TestMode.QUIZ_EN_TO_JP;
  const question = isEnglishQuestion ? currentWord.en : currentWord.jp;
  const answer = isEnglishQuestion ? currentWord.jp : currentWord.en;
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
        <div className="relative min-h-[240px] flex flex-col items-center justify-center p-5 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl shadow-inner text-center">
          {isEnglishQuestion && (
            <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
              <PronunciationButton word={currentWord} canSpeak={canSpeak} onSpeak={speakWord} />
            </div>
          )}

          <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">
            {isEnglishQuestion ? 'English' : 'Japanese'}
          </div>
          <h3 className="vocab-display-text font-bold text-slate-800 w-full">
            {question}
          </h3>

          <div className={`mt-8 transition-all duration-500 ${showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
              Correct Answer
            </div>
            <div className="vocab-answer-text font-bold text-emerald-600">
              {showAnswer ? answer : '?'}
            </div>
            {showAnswer && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <ReadingPill reading={currentWord.reading} />
                {!isEnglishQuestion && (
                  <PronunciationButton word={currentWord} canSpeak={canSpeak} onSpeak={speakWord} />
                )}
              </div>
            )}
          </div>

          {speechError && (
            <p className="mt-4 max-w-sm text-xs font-bold leading-relaxed text-rose-500">
              {speechError}
            </p>
          )}
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
