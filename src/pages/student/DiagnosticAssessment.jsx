import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpenCheck,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import Badge from '../../components/Badge';
import { api } from '../../services/api';

export default function DiagnosticAssessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReassessmentMode = searchParams.get('mode') === 'reassessment';

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      try {
        const res = await api.getDiagnosticQuestions('MATH-202');
        setQuestions(res.data || []);
      } catch (err) {
        console.warn('Failed to fetch diagnostic questions:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const totalQ = questions.length;
  const currentQ = questions[currentIndex];
  const progressPercent = totalQ > 0 ? Math.round(((currentIndex + 1) / totalQ) * 100) : 0;

  const handleSelectOption = (optionId) => {
    if (results) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Server-side scoring & evaluation
      const res = await api.submitDiagnosticAssessment({
        answers: selectedAnswers,
      });
      setResults(res.data);
      window.dispatchEvent(new Event('saarthi_gap_updated'));
    } catch (err) {
      console.error('Failed to submit assessment to server:', err);
      alert(err.message || 'Assessment submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="font-semibold text-slate-700">Loading Question Bank from MongoDB...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching syllabus-verified assessment questions.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        <h3 className="font-bold text-slate-900">No Assessment Questions Configured</h3>
        <p className="text-xs text-slate-400 mt-1">Please ensure the course diagnostic question bank is seeded.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isReassessmentMode ? 'Post-Remediation Reassessment' : 'Prerequisite Diagnostic Screening'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isReassessmentMode ? 'Continuous Growth Reassessment' : 'Diagnostic Knowledge Check'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Topic: Engineering Mathematics IV / BTCS 401 (ODEs & Discrete Math) • Evidence-Based Scoring
          </p>
        </div>

        {!results && (
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">Question</span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {currentIndex + 1} <span className="text-slate-400 text-sm">/ {totalQ}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      {results ? (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border shadow-xs ${
            results.score >= 70 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  results.score >= 70 ? 'text-emerald-800' : 'text-amber-800'
                }`}>
                  Server-Verified Score
                </span>
                <div className={`text-4xl font-extrabold mt-1 font-mono ${
                  results.score >= 70 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {results.score}%
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Correct: {results.correctCount} of {results.totalQ} questions
                </p>
              </div>

              <div className="space-y-2">
                {results.hasIntegrationGap ? (
                  <div className="p-3 rounded-xl bg-white border border-amber-300 text-xs space-y-1">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Foundational Prerequisite Bottleneck Flagged</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Your missed responses were specifically in <strong>Integration by Parts & Substitution (Prerequisite Core)</strong>, not the higher-level ODE concepts.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-emerald-300 text-xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Prerequisite Mastery Recovered</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Excellent work! You demonstrated proficient accuracy across prerequisite integration fundamentals.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 flex flex-wrap gap-3">
              <NavLink
                to="/student/learning-gaps"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Inspect Concept Knowledge Graph
              </NavLink>

              <NavLink
                to="/student/practice"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 shadow-xs transition-colors"
              >
                Go to Targeted Practice Exercises
              </NavLink>

              <NavLink
                to="/student/progress"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                View Auditable Progress Report
              </NavLink>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Question-by-Question Solution Analysis</h3>
            <div className="space-y-3">
              {results.questionsWithKeys?.map((q, idx) => {
                const userSelected = selectedAnswers[q.id];
                const isCorrect = userSelected === q.correctOptionId;
                return (
                  <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-700">Question {idx + 1}: {q.conceptName}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{isCorrect ? 'Correct' : 'Missed'}</span>
                      </span>
                    </div>
                    <div className="text-slate-800 font-medium">{q.question}</div>
                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                      <strong>Mathematical Explanation:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Question Card */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Tag */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
              {currentQ.conceptName}
            </span>
            {currentQ.isPrerequisiteCheck && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Prerequisite Verification Question
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="text-base font-semibold text-slate-900 leading-relaxed font-sans">
            {currentQ.question}
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-800'
                  }`}
                >
                  <span className="font-mono">{opt.text}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex === totalQ - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(selectedAnswers).length < totalQ}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading on Server...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
