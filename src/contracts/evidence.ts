import type { ProposalTruth } from './common';
import type { ItemFeedback } from './quiz';
export type MasteryLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'undetermined';
export type EvidenceStatus = 'single-observation' | 'initial-judgment' | 'repeated-validation' | 'confirmed' | 'insufficient';
export interface EvidenceEvent { evidenceId: string; kind: 'response' | 'restatement' | 'transfer'; sourceRef: string; summary: string; createdAt: string; }
export interface GradingProposal extends ProposalTruth { proposalId: string; items: ItemFeedback[]; evidenceCandidates: EvidenceEvent[]; masteryCandidate: MasteryLevel; evidenceStatus: EvidenceStatus; }
