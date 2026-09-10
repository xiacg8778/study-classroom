import type { AdapterResult } from '../../contracts/common';
import type { IdentityContext } from '../../contracts/identity';
import type { BootstrapData, CloseUnitCommand, CloseUnitProposal, LearningIntentCommand, MicroLessonProposal } from '../../contracts/learning';
import type { GradeQuizCommand } from '../../contracts/quiz';
import type { GradingProposal } from '../../contracts/evidence';
import type { PrepareRegistrationCommand, RegistrationProposal } from '../../contracts/registration';
export interface EducationCenterAdapter { bootstrap(identity:IdentityContext):Promise<AdapterResult<BootstrapData>>; routeLearningIntent(command:LearningIntentCommand):Promise<AdapterResult<MicroLessonProposal>>; gradeQuiz(command:GradeQuizCommand):Promise<AdapterResult<GradingProposal>>; closeLearningUnit(command:CloseUnitCommand):Promise<AdapterResult<CloseUnitProposal>>; prepareRegistration(command:PrepareRegistrationCommand):Promise<AdapterResult<RegistrationProposal>>; }
