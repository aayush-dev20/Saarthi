import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import {
  BookOpen,
  CheckCircle2,
  Award,
  Sparkles,
  ExternalLink,
  Download,
  Lightbulb,
  FileText,
  HelpCircle,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';

export default function LearningResourceModal({ isOpen, onClose, conceptCode = 'c5', onCompleted }) {
  const [activeTab, setActiveTab] = useState('derivation'); // 'derivation', 'examples', 'quiz', 'optional_video'
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function fetchResource() {
      setLoading(true);
      try {
        const res = await api.getLearningResource(conceptCode);
        if (isMounted && res.data) {
          setResource(res.data);
        }
      } catch (err) {
        console.warn('Failed to load learning resource:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchResource();
    return () => { isMounted = false; };
  }, [isOpen, conceptCode]);

  const handleSelectQuizOption = (qId, optionIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    setQuizSubmitted(true);
    setCompleted(true);
    try {
      await api.completeLearningResource(conceptCode, { answers: quizAnswers });
      window.dispatchEvent(new Event('saarthi_gap_updated'));
      if (onCompleted) onCompleted();
    } catch (err) {
      console.warn('Completion record warning:', err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resource?.title || 'Interactive Self-Contained Learning Module'}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <span>Loading verified faculty derivations from curriculum repository...</span>
        </div>
      ) : (
        <div className="space-y-4 text-xs font-sans">
          {/* Header Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="font-bold text-slate-900">{resource?.conceptName}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="text-slate-500 font-mono">{resource?.subjectCode}</span>
            </div>
            <div className="text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Authored by Department Faculty
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('derivation')}
              className={`flex-1 py-1.5 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'derivation' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Derivation & Theory</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('examples')}
              className={`flex-1 py-1.5 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'examples' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Worked Examples</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-1.5 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'quiz' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Self-Check ({resource?.postLearningQuestions?.length || 2} Qs)</span>
            </button>
            {resource?.embedUrl && (
              <button
                type="button"
                onClick={() => setActiveTab('optional_video')}
                className={`py-1.5 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'optional_video' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Optional Video</span>
              </button>
            )}
          </div>

          {/* TAB 1: Mathematical Derivation & Formulation */}
          {activeTab === 'derivation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <h4 className="font-bold text-indigo-900 text-sm">Mathematical Formulation from Product Rule</h4>
                <p className="text-slate-700 leading-relaxed font-sans">
                  {resource?.theoreticalDerivation ||
                    'Integration by parts is derived from the product rule of differentiation: d/dx [u*v] = u(dv/dx) + v(du/dx). Integrating both sides yields u*v = ∫ u dv + ∫ v du, leading to the standard formula: ∫ u dv = u*v - ∫ v du.'}
                </p>
              </div>

              {/* Formula Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 font-mono">
                <div className="text-[11px] text-indigo-300 font-sans font-semibold uppercase tracking-wider">
                  Canonical Formula Box
                </div>
                <div className="text-base font-bold text-amber-300">
                  {resource?.formulaBox?.formula || '∫ u dv = u * v - ∫ v du'}
                </div>
                <div className="text-xs text-slate-300 font-sans pt-1">
                  {resource?.formulaBox?.description || 'Optimal selection hierarchy for choosing u(x) via LIATE:'}
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 pt-1 font-sans">
                  {(resource?.formulaBox?.rules || [
                    'L — Logarithmic functions (Highest priority for u)',
                    'I — Inverse trigonometric functions',
                    'A — Algebraic polynomials',
                    'T — Trigonometric functions',
                    'E — Exponential functions (Lowest priority for u, ideal for dv)',
                  ]).map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-mono font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prerequisite Connection */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Why This Concept Resolves Your Academic Bottleneck</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {resource?.prerequisiteRefresher?.whyItMatters ||
                    'In Higher Order Differential Equations (BTCS 401 / MATH-202), reduction of order and undetermined coefficients require integrating factors that frequently require integration by parts. Mastering this restores confidence on exams.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Worked Examples */}
          {activeTab === 'examples' && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(resource?.workedExamples || []).map((ex, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span>{ex.problem}</span>
                  </div>

                  <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200 ml-2.5">
                    {ex.stepByStepSolution?.map((step, sIdx) => (
                      <p key={sIdx} className="text-slate-700 font-sans text-xs leading-relaxed">
                        {step}
                      </p>
                    ))}
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 font-mono text-emerald-900 font-semibold text-xs">
                    Final Result: {ex.finalAnswer}
                  </div>

                  {ex.pitfallToAvoid && (
                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      <strong>Common Pitfall:</strong> {ex.pitfallToAvoid}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Self-Check Quiz */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(resource?.postLearningQuestions || []).map((q, idx) => {
                  const selected = quizAnswers[q.id];
                  const hasSelected = selected !== undefined;
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                      <div className="font-bold text-slate-900">
                        {idx + 1}. {q.question}
                      </div>

                      <div className="space-y-1.5">
                        {q.options?.map((opt, optIdx) => {
                          const isThisSelected = selected === optIdx;
                          let btnStyle = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100';

                          if (quizSubmitted) {
                            if (optIdx === q.correctIndex) {
                              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                            } else if (isThisSelected) {
                              btnStyle = 'border-rose-400 bg-rose-50 text-rose-900';
                            }
                          } else if (isThisSelected) {
                            btnStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectQuizOption(q.id, optIdx)}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && optIdx === q.correctIndex && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mt-2 font-sans">
                          <strong>Solution:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length === 0}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                >
                  Confirm Answers & Record Concept Mastery
                </button>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <div className="font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Concept Review Completed!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Your understanding has been registered in the learning gap engine. Now proceed to practice or take a fresh reassessment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Optional Video (Non-Mandatory) */}
          {activeTab === 'optional_video' && resource?.embedUrl && (
            <div className="space-y-3">
              <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black shadow-xs">
                <iframe
                  src={resource.embedUrl}
                  title="Optional Visual Animation"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Optional supplementary visualization by {resource.author}. Core explanations and derivations are self-contained in the tabs above.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
