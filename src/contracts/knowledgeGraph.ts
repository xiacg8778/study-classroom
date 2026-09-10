export interface KnowledgeNode { id: string; label: string; kind: 'fact' | 'candidate-overlay'; evidenceState: string; sourceRef: string; relatedWrongQuestionIds: string[]; }
export interface KnowledgeEdge { id: string; source: string; target: string; relation: 'prerequisite' | 'candidate-next'; }
export interface KnowledgeGraphView { nodes: KnowledgeNode[]; edges: KnowledgeEdge[]; sourceRefs: string[]; }
