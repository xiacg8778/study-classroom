import type { EducationCenterAdapter } from '../ports/EducationCenterAdapter'; import type { HostCommitPort } from '../ports/HostCommitPort';
export interface FutureHostAdapterFactory { createEducationAdapter(): EducationCenterAdapter; createCommitAdapter(): HostCommitPort; }
