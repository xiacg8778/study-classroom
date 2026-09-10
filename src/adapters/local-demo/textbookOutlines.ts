/**
 * 教材单元清单权威数据源（单一真相）。
 *
 * 为什么单独建这个文件：教材目录此前散落在 localDemoFixtures 里「手工挑几课」，
 * 结果二上漏了 3 个单元、二下只建了 3 课——漏章节是必然的。
 * 现在把「这一册应当有哪些单元」独立成可测试的清单，由 textbookCoverage.test.ts
 * 强制校验：清单里任一单元没有对应课程，测试直接失败。补课不再是可选项。
 *
 * 来源：公开教学大纲 / 教材目录（苏教版小学数学、统编版小学语文），
 * 仅收录单元与课时结构（公开事实），不含任何出版社图文。
 */
export interface UnitSpec {
  /** 单元序号，1 起 */
  unitNo: number;
  /** 单元标题（与教材目录一致） */
  title: string;
  /** 该单元下的课时/知识点（公开目录结构） */
  topics: string[];
  /** 覆盖该单元的 lessonId 列表（至少 1 个，由覆盖率测试强制） */
  lessonIds: string[];
}

export interface TextbookOutline {
  textbookId: string;
  subject: '数学' | '语文';
  grade: string;
  /** 对齐的教材版本 */
  edition: string;
  /** 清单来源说明 */
  source: string;
  units: UnitSpec[];
}

/* ========== 苏教版 数学 二年级上册 ========== */
export const sj2aOutline: TextbookOutline = {
  textbookId: 'sj-math-2a-original',
  subject: '数学',
  grade: '二年级',
  edition: '苏教版',
  source: '苏教版小学数学二年级上册目录（公开教学大纲）',
  units: [
    { unitNo: 1, title: '100以内的加法和减法(三)', topics: ['连加、连减', '加减混合运算', '简单的加减法实际问题'], lessonIds: ['sj2a-unit1-addsub', 'sj2a-unit1-practice'] },
    { unitNo: 2, title: '平行四边形的初步认识', topics: ['四边形、五边形和六边形的初步认识', '认识平行四边形'], lessonIds: ['sj2a-unit2-quadrilateral'] },
    { unitNo: 3, title: '表内乘法(一)', topics: ['乘法的初步认识', '1~4的乘法口诀', '5的乘法口诀', '乘加、乘减', '6的乘法口诀'], lessonIds: ['sj2a-unit3-multiply1', 'sj2a-unit3-multiply2'] },
    { unitNo: 4, title: '表内除法(一)', topics: ['平均分的含义', '平均分成几份', '除法的初步认识', '用1~6的乘法口诀求商'], lessonIds: ['sj2a-unit4-division'] },
    { unitNo: 5, title: '厘米和米', topics: ['线段的初步认识', '认识厘米', '认识米', '我们身体上的「尺」'], lessonIds: ['sj2a-unit4-length'] },
    { unitNo: 6, title: '表内乘法和表内除法(二)', topics: ['7的乘法口诀', '用7的口诀求商', '8的乘法口诀', '用8的口诀求商', '9的乘法口诀和用口诀求商', '乘法口诀表', '连乘、连除和乘除混合运算'], lessonIds: ['sj2a-unit6-recipe7to9'] },
    { unitNo: 7, title: '观察物体', topics: ['从前、后、左、右观察物体', '观察物体练习'], lessonIds: ['sj2a-unit7-observe'] },
    { unitNo: 8, title: '期末复习', topics: ['表内乘除法复习', '加减两步计算复习', '厘米和米、多边形、观察物体复习', '简单实际问题复习'], lessonIds: ['sj2a-unit8-review'] },
  ],
};

/* ========== 苏教版 数学 二年级下册 ========== */
export const sj2bOutline: TextbookOutline = {
  textbookId: 'sj-math-2b-original',
  subject: '数学',
  grade: '二年级',
  edition: '苏教版',
  source: '苏教版小学数学二年级下册目录（公开教学大纲）',
  units: [
    { unitNo: 1, title: '有余数的除法', topics: ['有余数的除法', '除法竖式'], lessonIds: ['sj2b-unit1-remainder'] },
    { unitNo: 2, title: '时、分、秒', topics: ['认识时、分', '认识几时几分', '认识秒'], lessonIds: ['sj2b-unit2-time'] },
    { unitNo: 3, title: '认识方向', topics: ['认识东、南、西、北', '认识平面图上的东、南、西、北', '认识东南、西南、东北、西北'], lessonIds: ['sj2b-unit3-direction'] },
    { unitNo: 4, title: '认识万以内的数', topics: ['千以内数的认识', '千以内数的读写', '用算盘表示千以内的数', '万以内数的认识与读写', '比较大小', '近似数'], lessonIds: ['sj2b-unit3-recognize-numbers'] },
    { unitNo: 5, title: '分米和毫米', topics: ['认识分米和毫米', '简单的单位换算'], lessonIds: ['sj2b-unit5-dm-mm'] },
    { unitNo: 6, title: '两、三位数的加法和减法', topics: ['两位数加两位数的口算', '两位数减两位数的口算', '两步计算的加减法实际问题', '三位数的进位加法', '三位数的退位减法', '三位数的隔位退位减法'], lessonIds: ['sj2b-unit6-addsub'] },
    { unitNo: 7, title: '角的初步认识', topics: ['认识角', '认识直角、锐角、钝角'], lessonIds: ['sj2b-unit7-angle'] },
    { unitNo: 8, title: '数据的收集和整理(一)', topics: ['按不同标准分类', '简单数据的收集和整理'], lessonIds: ['sj2b-unit8-data'] },
    { unitNo: 9, title: '期末复习', topics: ['认数和有余数除法复习', '两、三位数的加法和减法复习', '计量单位、角和方向复习', '解决实际问题和数据收集复习'], lessonIds: ['sj2b-unit9-review'] },
  ],
};

/* ========== 统编版 语文 二年级上册 ========== */
export const yw2aOutline: TextbookOutline = {
  textbookId: 'yw-2a-original',
  subject: '语文',
  grade: '二年级',
  edition: '统编版',
  source: '统编版小学语文二年级上册目录（公开教学大纲）',
  units: [
    { unitNo: 1, title: '课文（一）：大自然的秘密', topics: ['小蝌蚪找妈妈', '我是什么', '植物妈妈有办法'], lessonIds: ['yw2a-unit1-reading'] },
    { unitNo: 2, title: '识字（一）：生活与自然', topics: ['场景歌', '树之歌', '拍手歌', '田家四季歌'], lessonIds: ['yw2a-unit2-sentences'] },
    { unitNo: 3, title: '课文（二）：儿童生活', topics: ['曹冲称象', '玲玲的画', '一封信', '妈妈睡了'], lessonIds: ['yw2a-unit3-story'] },
    { unitNo: 4, title: '课文（三）：家乡美景', topics: ['古诗二首（登鹳雀楼、望庐山瀑布）', '黄山奇石', '日月潭', '葡萄沟'], lessonIds: ['yw2a-unit4-scenery'] },
    { unitNo: 5, title: '课文（四）：思维方法', topics: ['坐井观天', '寒号鸟', '我要的是葫芦'], lessonIds: ['yw2a-unit5-fable'] },
    { unitNo: 6, title: '课文（五）：伟人与革命', topics: ['大禹治水', '朱德的扁担', '难忘的泼水节'], lessonIds: ['yw2a-unit6-hero'] },
    { unitNo: 7, title: '课文（六）：想象世界', topics: ['古诗二首（夜宿山寺、敕勒歌）', '雾在哪里', '雪孩子'], lessonIds: ['yw2a-unit7-imagine'] },
    { unitNo: 8, title: '课文（七）：动物故事', topics: ['狐假虎威', '狐狸分奶酪', '纸船和风筝', '风娃娃'], lessonIds: ['yw2a-unit8-animal'] },
  ],
};

/* ========== 统编版 语文 二年级下册 ========== */
export const yw2bOutline: TextbookOutline = {
  textbookId: 'yw-2b-original',
  subject: '语文',
  grade: '二年级',
  edition: '统编版',
  source: '统编版小学语文二年级下册目录（公开教学大纲）',
  units: [
    { unitNo: 1, title: '课文（一）：春天', topics: ['古诗二首（村居、咏柳）', '找春天', '开满鲜花的小路', '邓小平爷爷植树'], lessonIds: ['yw2b-unit1-findinfo', 'yw2b-unit2-guess-words'] },
    { unitNo: 2, title: '课文（二）：关爱', topics: ['雷锋叔叔，你在哪里', '千人糕', '一匹出色的马'], lessonIds: ['yw2b-unit2-care'] },
    { unitNo: 3, title: '识字：传统文化', topics: ['神州谣', '传统节日', '「贝」的故事', '中国美食'], lessonIds: ['yw2b-unit3-culture'] },
    { unitNo: 4, title: '课文（三）：童心', topics: ['彩色的梦', '枫树上的喜鹊', '沙滩上的童话', '我是一只小虫子'], lessonIds: ['yw2b-unit4-childhood'] },
    { unitNo: 5, title: '课文（四）：道理', topics: ['寓言二则（亡羊补牢、揠苗助长）', '画杨桃', '小马过河'], lessonIds: ['yw2b-unit5-lesson'] },
    { unitNo: 6, title: '课文（五）：自然与科学', topics: ['古诗二首（晓出净慈寺送林子方、绝句）', '雷雨', '要是你在野外迷了路', '太空生活趣事多'], lessonIds: ['yw2b-unit6-nature'] },
    { unitNo: 7, title: '课文（六）：改变', topics: ['大象的耳朵', '蜘蛛开店', '青蛙卖泥塘', '小毛虫'], lessonIds: ['yw2b-unit7-change'] },
    { unitNo: 8, title: '课文（七）：神话与想象', topics: ['祖先的摇篮', '当世界年纪还小的时候', '羿射九日'], lessonIds: ['yw2b-unit8-myth', 'yw2b-unit3-imagine'] },
  ],
};

export const allOutlines: TextbookOutline[] = [sj2aOutline, sj2bOutline, yw2aOutline, yw2bOutline];

/** 按 lessonId 反查所属单元（覆盖率测试与诊断用） */
export const unitByLessonId: Record<string, { textbookId: string; unitNo: number; title: string }> = Object.fromEntries(
  allOutlines.flatMap((outline) => outline.units.flatMap((unit) => unit.lessonIds.map((lessonId) => [lessonId, { textbookId: outline.textbookId, unitNo: unit.unitNo, title: unit.title }] as const))),
);
