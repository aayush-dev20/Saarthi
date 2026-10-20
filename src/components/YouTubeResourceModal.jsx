import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Play, CheckCircle2, Award, Clock, BookOpen, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export default function YouTubeResourceModal({ isOpen, onClose, conceptCode = 'INTEG-BY-PARTS', conceptTitle = 'Integration by Parts' }) {
  const [loading, setLoading] = useState(false);
  const [resource, setResource] = useState(null);
  const [activeTimestamp, setActiveTimestamp] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadResource() {
      setLoading(true);
      setError(null);
      setResult(null);
      setSelectedAnswers({});
      try {
        const res = await api.getLearningResource(conceptCode);
        if (isMounted && res.data) {
          setResource(res.data);
        }
      } catch (err) {
        console.warn('Could not load online resource, using fallback schema:', err.message);
        if (isMounted) {
          setResource({
            conceptCode: 'INTEG-BY-PARTS',
            title: 'Mastering Integration by Parts for Engineering Calculus',
            youtubeVideoId: '2I-_SV8cwsw',
            videoDurationSeconds: 1140,
            channelName: '3Blue1Brown & Khan Academy Calculus',
            keyTimestamps: [
              { label: 'Foundational Formula Intuition', seconds: 45 },
              { label: 'Selecting u and dv (LIATE Rule)', seconds: 210 },
              { label: 'Cyclic Integrals (Exponential * Trig)', seconds: 480 },
              { label: 'Application to Differential Equations', seconds: 750 },
            ],
            postAssessmentQuestions: [
              {
                question: 'When integrating x * e^x dx, what should you select as u using the LIATE heuristic?',
                options: ['u = e^x', 'u = x', 'u = x * e^x', 'u = 1'],
                correctIndex: 1,
                explanation: 'Algebraic terms (x) take priority over Exponential terms (e^x) for substitution as u.',
              },
              {
                question: 'What is the integral of ln(x) dx using integration by parts?',
                options: ['x * ln(x) - x + C', '1/x + C', 'x^2/2 * ln(x) + C', 'ln(x)/x + C'],
                correctIndex: 0,
                explanation: 'Set u = ln(x) and dv = dx, giving du = 1/x dx and v = x. Hence uv - integral(v du) = x*ln(x) - x + C.',
              },
            ],
            pointsReward: 35,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadResource();

    return () => {
      isMounted = false;
    };
  }, [isOpen, conceptCode]);

  const handleSeek = (seconds) => {
    setActiveTimestamp(seconds);
  };

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!resource?.postAssessmentQuestions) return;
    const questions = resource.postAssessmentQuestions;
    const unanswered = questions.findIndex((_, idx) => selectedAnswers[idx] === undefined);
    if (unanswered !== -1) {
      alert(`Please answer question #${unanswered + 1} before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = questions.map((_, idx) => selectedAnswers[idx]);
      const res = await api.completeLearningResource(conceptCode, { answers: answersArray });
      setResult(res.data);
      window.dispatchEvent(new Event('saarthi_leaderboard_updated'));
      window.dispatchEvent(new Event('saarthi_gap_updated'));
    } catch (err) {
      let score = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) score++;
      });
      const passed = score === questions.length;
      setResult({
        passed,
        score,
        totalQuestions: questions.length,
        pointsAwarded: passed ? (resource.pointsReward || 35) : 10,
        message: passed
          ? `Exceptional! You earned ${resource.pointsReward || 35} learning mastery points.`
          : `Review the recommended sections and try again. Partial credit: 10 points.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const videoId = resource?.youtubeVideoId || '2I-_SV8cwsw';
  const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${activeTimestamp}&autoplay=1&rel=0`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resource ? resource.title : `Remedial Module: ${conceptTitle}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Loading targeted video curriculum...
          </div>
        ) : resource ? (
          <>
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-md border border-slate-800">
              <iframe
                title={resource.title}
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Meta & Chapters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                    YouTube Masterclass
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {resource.channelName || 'Curated Academic Faculty'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {resource.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review the foundational principles, then test your understanding below to certify concept remediation and earn leaderboard points.
                </p>
              </div>

              {/* Timestamp Chapters */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Key Chapters</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {resource.keyTimestamps?.map((ts, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSeek(ts.seconds)}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white hover:text-indigo-600 flex items-center justify-between text-slate-600 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <span className="truncate pr-2">{ts.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {Math.floor(ts.seconds / 60)}:{(ts.seconds % 60).toString().padStart(2, '0')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Post Video Assessment */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Concept Verification Quiz
                  </h4>
                  <p className="text-xs text-slate-500">
                    Earn up to +{resource.pointsReward || 35} points for your academic rank
                  </p>
                </div>
                {result && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    result.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {result.passed ? 'Mastery Verified' : 'Review Recommended'}
                  </span>
                )}
              </div>

              {result ? (
                <div className={`p-4 rounded-xl border ${result.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Score: {result.score} / {result.totalQuestions} ({result.pointsAwarded} XP Awarded)
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed mb-3">
                    {result.message}
                  </p>
                  <button
                    onClick={() => setResult(null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Retake Verification
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {resource.postAssessmentQuestions?.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                      <div className="text-xs font-semibold text-slate-900">
                        {qIdx + 1}. {q.question}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[qIdx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(qIdx, optIdx)}
                              className={`text-left p-2.5 rounded-lg text-xs border transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {submitting ? 'Verifying Answers...' : 'Submit & Claim Points'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            No video resources found for this concept.
          </div>
        )}
      </div>
    </Modal>
  );
}
