import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  GitFork,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  BookOpenCheck,
  AlertTriangle,
  TrendingUp,
  Play,
  Loader2,
} from 'lucide-react';
import ConceptGraph from '../../components/ConceptGraph';
import Badge from '../../components/Badge';
import LearningResourceModal from '../../components/LearningResourceModal';
import { api } from '../../services/api';

const defaultKnowledgeEdges = [
  { id: 'e1-2', source: 'c1', target: 'c2' },
  { id: 'e2-3', source: 'c2', target: 'c3' },
  { id: 'e3-5', source: 'c3', target: 'c5' },
  { id: 'e5-6', source: 'c5', target: 'c6', animated: true },
  { id: 'e4-6', source: 'c4', target: 'c6' },
  { id: 'e6-7', source: 'c6', target: 'c7' },
];

export default function LearningGaps() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState(defaultKnowledgeEdges);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGaps = async () => {
    try {
      const res = await api.getLearningGaps();
      if (res.data?.nodes) {
        setNodes(res.data.nodes);
        if (res.data.edges && res.data.edges.length > 0) setEdges(res.data.edges);

        const gapNode = res.data.nodes.find((n) => n.id === 'c5' || n.data?.isFlaggedGap);
        if (gapNode) {
          setSelectedConcept(gapNode.data);
        } else if (res.data.nodes.length > 0) {
          setSelectedConcept(res.data.nodes[0].data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live learning gaps:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();

    window.addEventListener('saarthi_gap_updated', fetchGaps);
    return () => window.removeEventListener('saarthi_gap_updated', fetchGaps);
  }, []);

  const handleSelectConcept = (conceptData) => {
    setSelectedConcept(conceptData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Saarthi Signature Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prerequisite Learning Gap Diagnosis
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Academic struggles are often caused by foundational misconceptions rather than the current topic. Saarthi analyzes assessment evidence to pinpoint exact prerequisite gaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <NavLink
            to="/student/assessment"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Take Diagnostic</span>
          </NavLink>

          <NavLink
            to="/student/practice"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <BookOpenCheck className="w-4 h-4 text-indigo-600" />
            <span>Practice Sets</span>
          </NavLink>
        </div>
      </div>

      {/* Main Interactive Work Area: Concept Graph + Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: React Flow Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-indigo-600" />
              Engineering Mathematics IV Knowledge Graph (Calculus → ODEs)
            </span>
            <span>Click any node to inspect</span>
          </div>

          <ConceptGraph
            nodes={nodes}
            edges={edges}
            onSelectConcept={handleSelectConcept}
          />

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
            <span><strong>Diagnostic Evidence Note:</strong> Diagnosis is probabilistically modeled based on assessment responses in MongoDB.</span>
            <span className="text-indigo-600 font-semibold">Sem 4 Live DB Map</span>
          </div>
        </div>

        {/* Right Col: Concept Inspection & Action Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[460px]">
            {selectedConcept ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedConcept.category}
                  </span>
                  <Badge
                    variant={
                      selectedConcept.status === 'gap' || selectedConcept.isFlaggedGap
                        ? 'warning'
                        : selectedConcept.status === 'mastered' || selectedConcept.mastery >= 80
                        ? 'success'
                        : 'primary'
                    }
                  >
                    {selectedConcept.status === 'gap' || selectedConcept.isFlaggedGap ? 'Prerequisite Gap' : selectedConcept.status || 'Proficient'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {selectedConcept.label}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {selectedConcept.description}
                  </p>
                </div>

                {/* Mastery Level */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Concept Mastery Score</span>
                    <span className="font-bold text-slate-900">{selectedConcept.mastery}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedConcept.status === 'gap' || selectedConcept.isFlaggedGap ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${selectedConcept.mastery}%` }}
                    />
                  </div>
                </div>

                {/* Evidence Callout */}
                {selectedConcept.evidence && (
                  <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-200 text-xs">
                    <div className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Assessment Evidence
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      {selectedConcept.evidence}
                    </p>
                  </div>
                )}

                {/* Prerequisite Impact */}
                <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs space-y-1">
                  <div className="font-semibold text-indigo-900 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Prerequisite Relationship
                  </div>
                  <p className="text-indigo-950 text-[11px] leading-relaxed">
                    Integration fundamentals directly govern your ability to calculate Integrating Factors and solve non-homogeneous ODEs.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Remedial Masterclass (+35 XP)</span>
                  </button>

                  <NavLink
                    to="/student/practice"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Start Recovery Practice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </NavLink>

                  <NavLink
                    to="/student/assessment"
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs text-center transition-colors block"
                  >
                    Take Diagnostic Assessment
                  </NavLink>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Select any concept node in the graph to view diagnostics and recovery steps.
              </div>
            )}
          </div>
        </div>
      </div>

      <LearningResourceModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        conceptCode={selectedConcept?.code || selectedConcept?.id || 'c5'}
        onCompleted={fetchGaps}
      />
    </div>
  );
}
