import { describe, expect, it } from 'vitest';
import { PdfJsLocalDocumentAdapter } from '../../src/adapters/pdfjs/PdfJsLocalDocumentAdapter';
import { contentPolicy } from '../../src/config/contentPolicy';
import { LocalDemoEducationCenterAdapter } from '../../src/adapters/local-demo/LocalDemoEducationCenterAdapter';
import { UnavailableHostCommitAdapter } from '../../src/adapters/local-demo/UnavailableHostCommitAdapter';
import type { RegistrationProposal } from '../../src/contracts/registration';

const identity = {
  workspaceId: 'family-one',
  learnerId: 'learner-a',
  sessionId: 'session-a',
  baseContextVersion: 1,
  consentScopeRef: 'guardian-local-consent@1',
};

describe('independent QA security boundaries', () => {
  it('rejects valid PDF bytes when MIME type and extension are not PDF', async () => {
    const adapter = new PdfJsLocalDocumentAdapter();
    const validHeaderOnly = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
    const disguised = new File([validHeaderOnly], 'notes.txt', { type: 'text/plain' });

    await expect(adapter.open(disguised)).rejects.toThrow('PDF_PARSE_FAILED');
    expect(adapter.isOpen()).toBe(false);
  });

  it('rejects an oversized PDF before reading bytes', async () => {
    const adapter = new PdfJsLocalDocumentAdapter();
    let read = false;
    const oversized = {
      name: 'too-large.pdf',
      size: contentPolicy.maxPdfBytes + 1,
      type: 'application/pdf',
      arrayBuffer: async () => {
        read = true;
        return new ArrayBuffer(0);
      },
    } as File;

    await expect(adapter.open(oversized)).rejects.toThrow('PDF_LIMIT_EXCEEDED');
    expect(read).toBe(false);
    expect(adapter.isOpen()).toBe(false);
  });

  it('isolates idempotency keys by learner identity', async () => {
    const adapter = new LocalDemoEducationCenterAdapter();
    const first = await adapter.routeLearningIntent({
      requestId: 'request-a',
      idempotencyKey: 'same-key',
      identity,
      intent: 'problem',
      problemText: '学习者 A 的题目',
    });
    const crossLearner = await adapter.routeLearningIntent({
      requestId: 'request-b',
      idempotencyKey: 'same-key',
      identity: { ...identity, learnerId: 'learner-b', sessionId: 'session-b' },
      intent: 'problem',
      problemText: '学习者 B 的不同题目',
    });

    expect(first.ok).toBe(true);
    expect(crossLearner.ok).toBe(true);
  });

  it('never returns a committed receipt when HostCommit is unavailable', async () => {
    const host = new UnavailableHostCommitAdapter();
    const proposal: RegistrationProposal = {
      schemaVersion: 'registration-proposal@1.0.0',
      proposalId: 'proposal-1',
      workspaceId: identity.workspaceId,
      learnerId: identity.learnerId,
      sessionId: identity.sessionId,
      baseContextVersion: identity.baseContextVersion,
      evidenceCursor: 'none',
      promptBundleRef: 'local-demo-original@1.0.0',
      idempotencyKey: 'commit-key',
      mutations: [],
      persistenceIntent: 'propose',
    };

    expect(host.availability()).toBe('unavailable');
    const result = await host.commit(proposal);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('HOST_COMMIT_UNAVAILABLE');
    expect(JSON.stringify(result)).not.toContain('committed');
  });
});
