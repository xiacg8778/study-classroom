/**
 * 教材目录覆盖率测试——防止「漏章节」问题复发。
 *
 * 背景：教材目录此前靠手工挑课，二上漏了 3 个单元、二下只建了 3 课。
 * 本测试以 textbookOutlines.ts 的权威单元清单为基准，强制校验：
 *   1. 每个教材的 lessons 必须覆盖清单里的**每一个单元**（缺任一单元即失败）
 *   2. 清单里每个 lessonId 必须真实存在于教材 lessons 中（防清单写了但没实现）
 *   3. 每课必须有配套 pack（讲解）与 quiz（测验），否则课堂上生成会降级/错配
 *   4. 每课必须有 pages 正文与 outline 目录（课堂左栏要展示）
 *
 * 任何一条不过，说明「教材目录与官方单元结构脱节」——这正是漏章节的根因。
 */
import {describe,expect,it} from 'vitest';
import {demoTextbooks,sjLessonPacks,sj2bLessonPacks,ywLessonPacks,yw2bLessonPacks,sjQuizByLesson,sj2bQuizByLesson,ywQuizByLesson,yw2bQuizByLesson} from '../../src/adapters/local-demo/localDemoFixtures';
import {allOutlines} from '../../src/adapters/local-demo/textbookOutlines';

const packByLesson:Record<string,unknown>={...sjLessonPacks,...sj2bLessonPacks,...ywLessonPacks,...yw2bLessonPacks};
const quizByLesson:Record<string,unknown>={...sjQuizByLesson,...sj2bQuizByLesson,...ywQuizByLesson,...yw2bQuizByLesson};

const textbookById=Object.fromEntries(demoTextbooks.map((book)=>[book.textbookId,book]));

describe('教材目录覆盖率（防止漏章节）',()=>{
  it('每个权威清单都对应一本真实教材',()=>{
    for(const outline of allOutlines){
      expect(textbookById[outline.textbookId],`教材 ${outline.textbookId} 不存在`).toBeDefined();
    }
  });

  for(const outline of allOutlines){
    describe(`${outline.textbookId}（${outline.edition} ${outline.grade} ${outline.subject}）`,()=>{
      const book=textbookById[outline.textbookId];
      const lessonIds=new Set((book?.lessons??[]).map((lesson)=>lesson.lessonId));

      it(`覆盖全部 ${outline.units.length} 个单元（缺任一单元即失败）`,()=>{
        const missingUnits=outline.units.filter((unit)=>!unit.lessonIds.some((lessonId)=>lessonIds.has(lessonId)));
        expect(missingUnits.map((unit)=>`第${unit.unitNo}单元 ${unit.title}`),'以下单元在教材目录里没有任何课程').toEqual([]);
      });

      it('清单里每个 lessonId 都真实存在于教材目录',()=>{
        const declared=outline.units.flatMap((unit)=>unit.lessonIds);
        const missing=declared.filter((lessonId)=>!lessonIds.has(lessonId));
        expect(missing,'清单声明了但教材里没有的课程').toEqual([]);
      });

      it('教材里的每一课都被清单收录（防止孤儿课程）',()=>{
        const declared=new Set(outline.units.flatMap((unit)=>unit.lessonIds));
        const orphan=[...lessonIds].filter((lessonId)=>!declared.has(lessonId));
        expect(orphan,'教材里有但清单未收录的课程').toEqual([]);
      });

      it('每一课都有配套讲解包与测验，且正文与目录完整',()=>{
        for(const lesson of book.lessons){
          expect(packByLesson[lesson.lessonId],`${lesson.lessonId} 缺少学习包（讲解会降级）`).toBeDefined();
          expect(quizByLesson[lesson.lessonId],`${lesson.lessonId} 缺少配套测验`).toBeDefined();
          expect(lesson.pages.length,`${lesson.lessonId} 正文页数不足`).toBeGreaterThanOrEqual(3);
          expect(lesson.outline?.length,`${lesson.lessonId} 缺少本节目录`).toBeGreaterThanOrEqual(3);
        }
      });

      it('单元内的课程在教材目录中按单元顺序排列',()=>{
        const order=new Map(book.lessons.map((lesson,index)=>[lesson.lessonId,index]));
        let lastIndex=-1;
        for(const unit of outline.units){
          const indexes=unit.lessonIds.map((lessonId)=>order.get(lessonId)??-1).filter((index)=>index>=0);
          if(indexes.length===0)continue;
          const first=Math.min(...indexes);
          expect(first,`第${unit.unitNo}单元 ${unit.title} 的课程顺序与单元顺序不一致`).toBeGreaterThan(lastIndex);
          lastIndex=Math.max(...indexes);
        }
      });
    });
  }

  it('每本教材至少覆盖 8 个单元（防整体规模缩水）',()=>{
    for(const outline of allOutlines){
      expect(outline.units.length,`${outline.textbookId} 单元数不足`).toBeGreaterThanOrEqual(8);
    }
  });
});
