import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import {
  ShieldCheck,
  AlertOctagon,
  Search,
  Scale,
  GitBranch,
  ShieldAlert,
  Zap,
  CheckCircle,
  Eye,
  Sliders,
  UserCheck,
  CheckCheck,
} from 'lucide-react';
import { TimelineEvent } from '../../lib/types';

interface AgentDAGViewerProps {
  activeNode?: string | null;
  completedNodes?: string[];
  haltedNode?: string | null;
  events?: TimelineEvent[];
  onSelectNode?: (nodeId: string) => void;
}

// Custom Node Component
interface CustomNodeData {
  label: string;
  sublabel: string;
  icon: any;
  status: 'idle' | 'running' | 'completed' | 'halted' | 'failed';
  detail?: string;
}

const CyberNode = ({ data }: { data: CustomNodeData }) => {
  const Icon = data.icon;

  const statusStyles = {
    idle: 'bg-panel/80 border-panel-border text-gray-400',
    running: 'bg-cyan/15 border-cyan shadow-cyan-md text-cyan animate-pulse',
    completed: 'bg-emerald/10 border-emerald/50 shadow-emerald-sm text-emerald',
    halted: 'bg-terracotta/20 border-terracotta shadow-red-sm text-terracotta animate-bounce',
    failed: 'bg-terracotta/20 border-terracotta shadow-red-sm text-terracotta',
  };

  const badgeBg = {
    idle: 'bg-gray-800 text-gray-400',
    running: 'bg-cyan text-black font-bold animate-ping',
    completed: 'bg-emerald text-black font-semibold',
    halted: 'bg-terracotta text-white font-bold',
    failed: 'bg-terracotta text-white font-bold',
  };

  return (
    <div
      className={`relative px-3.5 py-3 rounded-xl border backdrop-blur-md min-w-[190px] max-w-[220px] transition-all duration-300 ${statusStyles[data.status]}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan/50 !border-panel-border !w-2.5 !h-2.5" />
      
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-black/40">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-white">
            {data.label}
          </span>
        </div>
        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-full ${badgeBg[data.status]}`}>
          {data.status}
        </span>
      </div>

      <p className="text-[10px] text-gray-400 leading-tight truncate font-sans">
        {data.detail || data.sublabel}
      </p>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan/50 !border-panel-border !w-2.5 !h-2.5" />
    </div>
  );
};

const nodeTypes = {
  cyberNode: CyberNode,
};

export const AgentDAGViewer: React.FC<AgentDAGViewerProps> = ({
  activeNode,
  completedNodes = [],
  haltedNode,
  events = [],
  onSelectNode,
}) => {
  // Determine status for a given node id
  const getNodeStatus = (nodeId: string): 'idle' | 'running' | 'completed' | 'halted' | 'failed' => {
    // Breaker halted status
    if (
      haltedNode === nodeId ||
      (nodeId === 'execute' && (haltedNode === 'merchant_verification' || haltedNode === 'safe_halt')) ||
      (nodeId === 'human_review' && (haltedNode === 'safe_halt' || haltedNode === 'human_review'))
    ) {
      return 'halted';
    }

    // Active status
    if (
      activeNode === nodeId ||
      (nodeId === 'execute' && activeNode === 'merchant_verification') ||
      (nodeId === 'resolve' && activeNode === 'monitor') ||
      (nodeId === 'human_review' && activeNode === 'human_review')
    ) {
      return 'running';
    }

    // Completed status
    if (completedNodes.includes(nodeId)) return 'completed';

    // Intermediary node completion bridge for backend execution flow
    if (
      nodeId === 'evidence_gatherer' &&
      (completedNodes.includes('evidence_gatherer') ||
        completedNodes.includes('planner') ||
        completedNodes.includes('validator') ||
        completedNodes.includes('execute') ||
        completedNodes.includes('monitor'))
    ) {
      return 'completed';
    }
    if (
      nodeId === 'conflict_arbiter' &&
      (completedNodes.includes('conflict_arbiter') ||
        completedNodes.includes('planner') ||
        completedNodes.includes('validator') ||
        completedNodes.includes('execute') ||
        completedNodes.includes('monitor'))
    ) {
      return 'completed';
    }
    if (
      nodeId === 'execute' &&
      (completedNodes.includes('execute') || completedNodes.includes('merchant_verification'))
    ) {
      return 'completed';
    }
    if (
      nodeId === 'resolve' &&
      (completedNodes.includes('resolve') || completedNodes.includes('monitor'))
    ) {
      return 'completed';
    }

    return 'idle';
  };

  // Find latest detail message for a node
  const getNodeDetail = (nodeId: string) => {
    const rev = [...events].reverse();
    const ev = rev.find(
      (e) =>
        e.node === nodeId ||
        (nodeId === 'execute' && e.node === 'merchant_verification') ||
        (nodeId === 'resolve' && e.node === 'monitor') ||
        (nodeId === 'evidence_gatherer' && e.action?.toLowerCase().includes('cbs')) ||
        (nodeId === 'conflict_arbiter' && e.action?.toLowerCase().includes('ledger')) ||
        e.action?.toLowerCase().includes(nodeId)
    );
    return ev?.msg || undefined;
  };

  // DAG Layout definition
  const rawNodes = [
    {
      id: 'triage',
      label: '1. Triage Agent',
      sublabel: 'Grievance Intake & Entity Extraction',
      icon: ShieldCheck,
      x: 250,
      y: 0,
    },
    {
      id: 'skeptic',
      label: '2. Skeptic Agent',
      sublabel: 'Adversarial & Anomaly Check',
      icon: Eye,
      x: 250,
      y: 90,
    },
    {
      id: 'evidence_gatherer',
      label: '3. Evidence Gatherer',
      sublabel: 'Tri-Party Multi-Ledger Query',
      icon: Search,
      x: 250,
      y: 180,
    },
    {
      id: 'conflict_arbiter',
      label: '4. Conflict Arbiter',
      sublabel: 'Cross-Check Ledger Telemetry',
      icon: Scale,
      x: 250,
      y: 270,
    },
    {
      id: 'planner',
      label: '5. Action Planner',
      sublabel: 'Deterministic Policy Selection',
      icon: GitBranch,
      x: 250,
      y: 360,
    },
    {
      id: 'validator',
      label: '6. Safety Validator',
      sublabel: 'Token & Circuit Breaker Guard',
      icon: ShieldAlert,
      x: 250,
      y: 450,
    },
    {
      id: 'execute',
      label: '7. Allowlist Executor',
      sublabel: 'Allowlist Action Generation',
      icon: Zap,
      x: 100,
      y: 540,
    },
    {
      id: 'human_review',
      label: '8. Human Review',
      sublabel: 'HITL Queue (Amount > ₹50k / Breaker)',
      icon: UserCheck,
      x: 400,
      y: 540,
    },
    {
      id: 'resolve',
      label: '9. Audit Finalizer',
      sublabel: 'Cryptographic Ledger Persist',
      icon: CheckCheck,
      x: 250,
      y: 630,
    },
  ];

  const nodes: Node[] = useMemo(() => {
    return rawNodes.map((n) => ({
      id: n.id,
      type: 'cyberNode',
      position: { x: n.x, y: n.y },
      data: {
        label: n.label,
        sublabel: n.sublabel,
        icon: n.icon,
        status: getNodeStatus(n.id),
        detail: getNodeDetail(n.id),
      },
    }));
  }, [activeNode, completedNodes, haltedNode, events]);

  const rawEdges = [
    { source: 'triage', target: 'skeptic' },
    { source: 'skeptic', target: 'evidence_gatherer' },
    { source: 'evidence_gatherer', target: 'conflict_arbiter' },
    { source: 'conflict_arbiter', target: 'planner' },
    { source: 'planner', target: 'validator' },
    { source: 'validator', target: 'execute' },
    { source: 'validator', target: 'human_review' },
    { source: 'execute', target: 'resolve' },
    { source: 'human_review', target: 'resolve' },
  ];

  const edges: Edge[] = useMemo(() => {
    return rawEdges.map((e, idx) => {
      const isSourceCompleted = completedNodes.includes(e.source);
      const isTargetActive = activeNode === e.target;
      const isTargetHalted = haltedNode === e.target;
      const isPathActive = isSourceCompleted && (isTargetActive || completedNodes.includes(e.target));

      return {
        id: `e-${e.source}-${e.target}-${idx}`,
        source: e.source,
        target: e.target,
        animated: isTargetActive,
        style: {
          stroke: isTargetHalted
            ? '#EF4444'
            : isPathActive
            ? '#10B981'
            : isTargetActive
            ? '#00F0FF'
            : 'rgba(255,255,255,0.15)',
          strokeWidth: isPathActive || isTargetActive ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isTargetHalted
            ? '#EF4444'
            : isPathActive
            ? '#10B981'
            : isTargetActive
            ? '#00F0FF'
            : 'rgba(255,255,255,0.2)',
        },
      };
    });
  }, [activeNode, completedNodes, haltedNode]);

  return (
    <div className="w-full h-[620px] rounded-2xl border border-panel-border bg-obsidian relative overflow-hidden">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-cyber-grid opacity-25 pointer-events-none" />

      {/* Top Header Controls Overlay */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-panel/90 border border-panel-border text-gray-300">
          LANGGRAPH DAG TOPOLOGY (9 NODES)
        </span>
        {activeNode && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/15 border border-cyan/40 text-cyan animate-pulse">
            Active: {activeNode}
          </span>
        )}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectNode && onSelectNode(node.id)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1A1F2C" gap={20} size={1} />
        <Controls position="bottom-right" className="m-3" />
      </ReactFlow>
    </div>
  );
};

export default AgentDAGViewer;
