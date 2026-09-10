import type { MaterialOrigin, MaterialReference } from '../contracts/textbook';
import { contentPolicy } from '../config/contentPolicy';
import { stableHash } from './hash';
export class MaterialBoundaryService {
  public normalize(text: string): string { return Array.from(text).filter((character)=>{const code=character.charCodeAt(0);return code===9||code===10||code===13||code>=32&&code!==127&&!(code>=0x80&&code<=0x9f)&&!(code>=0x202a&&code<=0x202e)&&!(code>=0x2066&&code<=0x2069)&&code!==0xfeff;}).join('').slice(0, contentPolicy.maxMaterialChars).trim(); }
  public createReference(input: { origin: MaterialOrigin; documentId: string; lessonId?: string; page: number; text: string; startOffset?: number; }): MaterialReference {
    const quote = this.normalize(input.text); const startOffset = input.startOffset ?? 0;
    return { referenceId:`ref-${stableHash([input.documentId,input.page,startOffset,quote])}`, origin:input.origin, documentId:input.documentId, lessonId:input.lessonId, page:input.page, startOffset, endOffset:startOffset+quote.length, quote, quoteDigest:stableHash(quote), trustLevel:'untrusted-material' };
  }
}
