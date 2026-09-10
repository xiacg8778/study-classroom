export interface SafetyDecision { allowed: boolean; emergency: boolean; message: string; }
const EMERGENCY = [/自杀/i,/不想活/i,/杀死(他|她|人)/i,/伤害自己/i];
const DANGEROUS = [/制作炸弹/i,/绕过监护/i,/成人色情/i];
export class SafetyPolicyService {
  public evaluate(text: string): SafetyDecision {
    if (EMERGENCY.some((pattern)=>pattern.test(text))) return { allowed:false, emergency:true, message:'请立即停止当前学习任务，联系身边可信任的监护人；如有迫切危险，请联系当地紧急或专业支持。' };
    if (DANGEROUS.some((pattern)=>pattern.test(text))) return { allowed:false, emergency:false, message:'这段内容不适合在学习模式中继续分析，请更换安全的学习材料。' };
    return { allowed:true, emergency:false, message:'安全检查通过。' };
  }
}
