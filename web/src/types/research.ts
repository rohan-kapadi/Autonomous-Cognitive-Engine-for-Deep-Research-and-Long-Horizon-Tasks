export type WorkflowStatus =
  | 'idle'
  | 'scoping'
  | 'planning'
  | 'researching'
  | 'compressing'
  | 'waiting_for_approval'
  | 'completed'
  | 'failed';

export type StageStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'waiting_for_human'
  | 'completed'
  | 'failed';

export interface WorkflowStage {
  id: string;
  stepNumber: string; // '01', '02', '03'
  title: string;
  description: string;
  status: StageStatus;
  agent: string;
  nodeKey: string;
  duration?: string;
  timestamp?: string;
  details?: string;
}

export interface TaskItem {
  id: string;
  stageId: string;
  title: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary: string;
  toolCalls?: string[];
  outputExcerpt?: string;
  timestamp: string;
  sourcesCount?: number;
}

export interface SourceItem {
  id: string;
  title: string;
  domain: string;
  url: string;
  retrievalTimestamp: string;
  taskId: string;
  taskTitle: string;
  excerpt: string;
  status: 'retrieved' | 'used_in_synthesis' | 'referenced';
  relevanceScore?: number;
}

export interface ResearchBrief {
  title: string;
  scope: string;
  targetAudience: string;
  coreQuestions: string[];
  methodology: string;
  expectedOutcomes: string[];
  proposedOutline: string[];
}

export interface CognitiveStateSnapshot {
  activeModel: string;
  tokensProcessed: number;
  memoryNodesCount: number;
  unresolvedQuestions: string[];
  decisionsMade: string[];
  compressionRatio: string;
  checkpointsSaved: number;
  temporalReplaySafe: boolean;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  category: 'WORKFLOW' | 'AGENT' | 'SEARCH' | 'APPROVAL' | 'SYSTEM' | 'ERROR';
  level: 'INFO' | 'WARN' | 'EXEC' | 'TRACE';
  message: string;
  details?: string;
}

export interface ResearchRun {
  runId: string;
  title: string;
  researchTopic: string;
  status: WorkflowStatus;
  startTime: string;
  completionTime?: string;
  durationSeconds: number;
  brief: ResearchBrief | null;
  cognitiveState: CognitiveStateSnapshot;
  stages: WorkflowStage[];
  tasks: TaskItem[];
  sources: SourceItem[];
  events: LogEvent[];
  finalReport?: string;
  langsmithTraceUrl?: string;
  isApprovalRequired: boolean;
}

export interface ResearchPreset {
  id: string;
  title: string;
  topic: string;
  depth: 'standard' | 'deep' | 'comprehensive';
  estimatedDuration: string;
  recommendedAgents: string[];
}
