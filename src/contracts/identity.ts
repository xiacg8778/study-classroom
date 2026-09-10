export interface IdentityContext { workspaceId: string; learnerId: string; sessionId: string; baseContextVersion: number; consentScopeRef: string; }
export function identityKey(identity: Pick<IdentityContext, 'workspaceId' | 'learnerId'>): string {
  if (!identity.workspaceId || !identity.learnerId) throw new Error('INVALID_IDENTITY_CONTEXT');
  return `${identity.workspaceId}::${identity.learnerId}`;
}
