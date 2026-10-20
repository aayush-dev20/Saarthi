import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Award,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import Badge from '../../components/Badge';
import { api } from '../../services/api';

export default function PersonalizedPractice() {
  const navigate = useNavigate();
  const [practiceSets, setPracticeSets] = useState([]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState({});
  const [isSetComplete, setIsSetComplete] = useState(false);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSets() {
      try {
        const res = await api.getPracticeModule('ps-1');
        const list = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
        setPracticeSets(list);
      } catch (err) {
        console.warn('Failed to load practice sets from server:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSets();
  }, []);

  const currentSet = practiceSets[activeSetIndex] || {
    id: 'ps-1',
    title: 'Integration by Parts & U-Substitution Refresher',
    concept: 'c5',
    questions: [
      {
        id: 'pq-1',
        prompt: 'Evaluate ∫ x * cos(x) dx using integration by parts with formula u*v - ∫ v du.',
        options: [
          'x * sin(x) + cos(x) + C',
          'x * sin(x) - cos(x) + C',
          '-x * sin(x) + cos(x) + C',
          'sin(x) + C',
        ],
        correctIndex: 0,
        hint: 'Choose u = x (algebraic) and dv = cos(x) dx (trigonometric) following the LIATE rule.',
        explanation: 'With u = x, du = dx, and dv = cos(x) dx, v = sin(x): Result = x*sin(x) - ∫ sin(x) dx = x*sin(x) - (-cos(x)) + C = x*sin(x) + cos(x) + C.',
      },
      {
        id: 'pq-2',
        prompt: 'For the integral ∫ x / (x^2 + 4) dx, what is the most direct solution method?',
        options: [
          'U-Substitution with u = x^2 + 4',
          'Integration by Parts with u = x',
          'Trigonometric substitution with x = 2 tan θ',
          'Partial fractions expansion',
        ],
        correctIndex: 0,
        hint: 'The numerator x dx is proportional to the differential of the denominator x^2 + 4.',
        explanation: 'Let u = x^2 + 4, du = 2x dx => x dx = du / 2. The integral transforms into (1/2) ∫ du/u = (1/2) ln|x^2 + 4| + C.',
      },
    ],
  };

  const currentQ = currentSet.questions?.[activeQIndex] || currentSet.questions?.[0];
  const totalInSet = currentSet.questions?.length || 0;

  const handleSelectOption = (idx) => {
    setSelectedOption(idx);
    setShowExplanation(true);
    setCompletedQuestions((prev) => ({
      ...prev,
      [`${activeSetIndex}-${activeQIndex}`]: idx === currentQ.correctIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (activeQIndex < totalInSet - 1) {
      setActiveQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setShowHint(false);
    } else {
      setIsSetComplete(true);
    }
  };

  const handleFinishAndRecord = async () => {
    setSubmittingAttempt(true);
    try {
      await api.submitPracticeAttempt({
        setId: currentSet.id || 'ps-1',
      });
      window.dispatchEvent(new Event('saarthi_gap_updated'));
      navigate('/student/assessment?mode=reassessment');
    } catch (err) {
      console.warn('Practice attempt recording warning:', err.message);
      navigate('/student/assessment?mode=reassessment');
    } finally {
      setSubmittingAttempt(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <BookOpenCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Targeted Remediation Exercise</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Personalized Concept Practice
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Focus: Integration by Parts & U-Substitution (Prerequisite Core) • Interactive Derivations
          </p>
        </div>

        {!isSetComplete && (
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">Exercise</span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {activeQIndex + 1} <span className="text-slate-400 text-sm">/ {totalInSet}</span>
            </div>
          </div>
        )}
      </div>

      {isSetComplete ? (
        /* Completion View */
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Practice Module Completed!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You have worked through the foundational exercises for integration by parts. Now take the fresh Reassessment test to officially recover this prerequisite and update your concept mastery in MongoDB.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleFinishAndRecord}
              disabled={submittingAttempt}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {submittingAttempt ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Attempt...</span>
                </>
              ) : (
                <>
                  <span>Take Fresh Reassessment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsSetComplete(false);
                setActiveQIndex(0);
                setSelectedOption(null);
                setShowExplanation(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Restart Exercises
            </button>
          </div>
        </div>
      ) : (
        /* Active Practice Question */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          {/* Question text */}
          <div className="text-base font-semibold text-slate-900 leading-relaxed">
            {currentQ.prompt}
          </div>

          {/* Hint Trigger */}
          <div>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHint ? 'Hide Mathematical Hint' : 'Show Mathematical Hint'}</span>
            </button>

            {showHint && (
              <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <strong>Hint:</strong> {currentQ.hint}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;
              let styleClass = 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-800';

              if (showExplanation) {
                if (isCorrect) {
                  styleClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold';
                } else if (isSelected) {
                  styleClass = 'border-rose-400 bg-rose-50 text-rose-900';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={showExplanation}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${styleClass}`}
                >
                  <span className="font-mono">{opt}</span>
                  {showExplanation && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {showExplanation && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Step-by-Step Derivation</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans">{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {showExplanation && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                <span>{activeQIndex < totalInSet - 1 ? 'Next Question' : 'Complete Practice'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
