import type { ProposalTruth } from './common';
export type PathCode = 'P1'|'P2'|'P3'|'P4'|'P5'|'P6'|'P7'|'P8'|'P9';
export interface NextLessonProposal extends ProposalTruth { proposalId: string; primaryPath: PathCode; supportPath?: PathCode; rationale: string; evidenceRefs: string[]; durationMinutes: number; action: string; doNotDo: string; }
