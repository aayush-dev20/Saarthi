import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, CheckCircle, Lock, Target } from 'lucide-react';

// Custom Node for Knowledge Graph
function ConceptNodeComponent({ data, selected }) {
  const isGap = data.status === 'gap';
  const isMastered = data.status === 'mastered';
  const isTarget = data.isTarget;
  const isLocked = data.status === 'locked';

  const borderColors = isGap
    ? 'border-amber-400 bg-amber-50/90 text-amber-900 ring-2 ring-amber-300'
    : isMastered
    ? 'border-emerald-300 bg-white text-slate-800'
    : isTarget
    ? 'border-indigo-400 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-200'
    : isLocked
    ? 'border-slate-200 bg-slate-100/70 text-slate-400'
    : 'border-slate-200 bg-white text-slate-800';

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border shadow-xs transition-all w-48 text-left ${borderColors} ${
        selected ? 'ring-2 ring-indigo-500 shadow-md' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {data.category}
        </span>
        {isGap && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
            Gap
          </span>
        )}
        {isMastered && (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        )}
        {isTarget && (
          <Target className="w-3.5 h-3.5 text-indigo-600" />
        )}
        {isLocked && (
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        )}
      </div>

      <div className="font-semibold text-xs leading-snug line-clamp-1">
        {data.label}
      </div>

      {/* Mastery Progress Bar */}
      {!isLocked && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5 font-medium">
            <span>Mastery</span>
            <span>{data.mastery}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGap ? 'bg-amber-500' : isMastered ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${data.mastery}%` }}
            />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400" />
    </div>
  );
}

export default function ConceptGraph({ nodes, edges, onSelectConcept }) {
  const nodeTypes = useMemo(() => ({ conceptNode: ConceptNodeComponent }), []);

  return (
    <div className="h-[460px] w-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectConcept && onSelectConcept(node.data)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background color="#cbd5e1" gap={18} size={1} />
        <Controls className="!bg-white !border !border-slate-200 !shadow-xs !rounded-xl" />
      </ReactFlow>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Mastered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
          <span className="font-semibold text-amber-900">Prerequisite Gap</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span>Target Topic</span>
        </div>
      </div>
    </div>
  );
}
