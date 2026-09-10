import type { Textbook } from '../../contracts/textbook'; import type { Quiz } from '../../contracts/quiz';
export const demoQuiz:Quiz={ quizId:'fraction-quiz-01', questions:[
{questionId:'q1',type:'choice',prompt:'1/4 + 2/4 等于多少？',options:['3/4','3/8','2/4'],expectedAnswer:'3/4',rationale:'同分母分数相加，分母不变，分子相加。'},
{questionId:'q2',type:'fill',prompt:'3/5 - 1/5 = ____',expectedAnswer:'2/5',rationale:'分母相同，只计算分子 3-1。'},
{questionId:'q3',type:'steps',prompt:'写出 1/2 + 1/3 的通分与相加步骤。',expectedAnswer:'1/2=3/6，1/3=2/6，3/6+2/6=5/6',rationale:'先用最小公倍数 6 通分，再相加分子。'},
{questionId:'q4',type:'choice',prompt:'计算 2/3 - 1/6 时，第一步应该做什么？',options:['直接减分子','把 2/3 化为 4/6','把 1/6 化为 1/3'],expectedAnswer:'把 2/3 化为 4/6',rationale:'异分母不能直接相减，要先通分。'} ]};

/* 苏教版二年级上册配套测验（原创题目，对齐教学单元） */
export const sjAddSubQuiz:Quiz={ quizId:'sj2a-addsub-quiz-01', questions:[
{questionId:'s1',type:'choice',prompt:'计算 47 + 28，个位 7+8=15，下一步应该怎么做？',options:['向十位进 1，个位写 5','个位写 15','先算十位'],expectedAnswer:'向十位进 1，个位写 5',rationale:'个位相加满十，要向十位进 1，这是进位加法的关键一步。'},
{questionId:'s2',type:'fill',prompt:'52 - 37 = ____（先想：12-7=5，再算 40-30=10）',expectedAnswer:'15',rationale:'个位 2 减 7 不够减，从十位退一作十：12-7=5；十位剩下 4-3=1，结果是 15。'},
{questionId:'s3',type:'steps',prompt:'用「凑整」口算 63 + 28：写出你的两步计算过程。',expectedAnswer:'63+28：先 63+7=70，再 70+21=91（或先 63+20=83，再 83+8=91）',rationale:'把 28 拆成 7 和 21（或 20 和 8），凑整十再算，又快又准。'},
{questionId:'s4',type:'choice',prompt:'验算 81 - 45 = 36，用哪个算式检查最合适？',options:['36 + 45','81 + 45','36 - 45'],expectedAnswer:'36 + 45',rationale:'差 + 减数 = 被减数，用加法验算减法最直接。'} ]};

export const sjMultiplicationQuiz:Quiz={ quizId:'sj2a-mul-quiz-01', questions:[
{questionId:'m1',type:'choice',prompt:'5+5+5+5 写成乘法算式是哪一个？',options:['5×4','5+4','4×0'],expectedAnswer:'5×4',rationale:'4 个 5 相加，就是 5×4（或 4×5），乘号表示「几个几」。'},
{questionId:'m2',type:'fill',prompt:'3×4 = ____（想口诀：三四十二）',expectedAnswer:'12',rationale:'乘法口诀「三四十二」，表示 3 个 4 相加（或 4 个 3 相加）的结果。'},
{questionId:'m3',type:'steps',prompt:'一双筷子有 2 根，一家 5 口人吃饭要几根筷子？写出算式和想法。',expectedAnswer:'2×5=10（或 5×2=10），5 个 2 相加',rationale:'每人 1 双筷子即 2 根，5 人就是 5 个 2，用乘法算最简便。'},
{questionId:'m4',type:'choice',prompt:'哪一句口诀能同时算 2×6 和 6×2？',options:['二六十二','二五一十','六六三十六'],expectedAnswer:'二六十二',rationale:'乘法算式中交换两个数结果不变，所以同一句口诀可以算两道乘法。'} ]};

/* 苏教版二年级上册：对齐教学单元结构的原创示例教材。
   单元框架为公开课程事实；正文文字/例题为本项目原创，不使用教材出版社任何图文。 */
/* 每课学习包：复述提示/微课堂三步/错题章节，供引擎与课堂页按 lessonId 取用——不再按族套模板 */
export interface SjLessonPack{ restatementPrompt:string; objective:string; steps:Array<{title:string;body:string;action:string;visualCue:string}>; chapter:string; entry:string; avoid:string; cue:string; factNodes:Array<{id:string;label:string}>; }
export const sjLessonPacks:Record<string,SjLessonPack>={
  'sj2a-unit1-addsub':{ restatementPrompt:'请复述：两位数加法什么时候要进位？减法什么时候要退位？', objective:'掌握两位数加减法中进位与退位的关键步骤，能正确计算并验算', steps:[
    {title:'先看个位',body:'两位数加减先从个位算起。个位相加满十要向十位进 1；个位不够减要从十位退 1 当 10。',action:'指出个位相加是否满十（或是否够减）。',visualCue:'进位写小 1，退位点个点。'},
    {title:'再算十位',body:'十位计算时别忘了进上来的 1 或借出去的 1。',action:'算十位，说明要不要加（减）进（退）的 1。',visualCue:'十位数字旁边标注进（退）标记。'},
    {title:'验算确认',body:'减法用差+减数=被减数，加法用和-一个加数=另一个加数来验算。',action:'写出验算算式，确认结果一致。',visualCue:'把三个数「倒过来」再算一遍。'}],
    chapter:'100以内的加减法', entry:'先看个位是否满十（够减），确定进位或退位，再算十位。', avoid:'每一步写出数位对齐的竖式，完成后用加减互逆验算。', cue:'看到两位数加减，先盯个位：满十进 1，不够减退 1。', factNodes:[{id:'sj-addsub-carry',label:'进位与退位'},{id:'sj-addsub-check',label:'加减互逆验算'}] },
  'sj2a-unit1-practice':{ restatementPrompt:'请复述：连加连减按什么顺序算？验算时用什么关系检查？', objective:'掌握连加连减的计算顺序，会用加减互逆验算并避免抄错数', steps:[
    {title:'按顺序算',body:'连加连减从左往右，一步一步算，每步写清结果。',action:'说出先算哪一段，写出第一步结果。',visualCue:'用横线标出当前在算的一段。'},
    {title:'小心连续退位',body:'个位要连着两次退位时，每借一次十位都要减 1。',action:'检查十位有没有漏减退掉的 1。',visualCue:'在十位上方点退位标记。'},
    {title:'验算防错',body:'用最后结果倒回去加（减）一遍，对得上才算稳。',action:'写出验算算式并核对。',visualCue:'把结果「倒放」回原式检查。'}],
    chapter:'100以内的加减法', entry:'从左往右一段一段算，先算哪段就只算哪段。', avoid:'每步写中间结果；退位记得在十位点标记。', cue:'看到三个数连加连减，先划段再动笔。', factNodes:[{id:'sj-chain-order',label:'从左往右分段算'},{id:'sj-chain-check',label:'倒算验算'}] },
  'sj2a-unit2-quadrilateral':{ restatementPrompt:'请复述：平行四边形和长方形比，什么变了、什么没变？', objective:'初步认识四边形与平行四边形：有 4 条边 4 个角，对边平行且相等', steps:[
    {title:'认一认四边形',body:'长方形、正方形、平行四边形都是四边形：都有 4 条边、4 个角。',action:'指出身边一个四边形，数一数它的边和角。',visualCue:'数边数角时用手指点着数。'},
    {title:'找平行的一组对边',body:'平行四边形最特别的地方：两组对边分别平行且长度相等。',action:'在图形里找出互相平行的两条边。',visualCue:'用箭头标出平行的对边。'},
    {title:'拼一拼、拉一拉',body:'把长方形框架轻轻一拉，角变了、边没变，就成了平行四边形。',action:'说说拉动前后什么变了、什么没变。',visualCue:'想象活动框架被拉斜。'}],
    chapter:'平行四边形的初步认识', entry:'先数边和角确认是四边形，再看对边是否平行且相等。', avoid:'判断图形时先数边角，再对特征，不凭感觉。', cue:'看到「斜着的四边形」，先想平行四边形：对边平行且相等。', factNodes:[{id:'sj-quad-4side',label:'四边形：4 边 4 角'},{id:'sj-para-parallel',label:'平行四边形：对边平行'}] },
  'sj2a-unit3-multiply1':{ restatementPrompt:'请复述：把 4 个 3 相加写成乘法算式，你是怎么想的？', objective:'理解乘法是相同加数连加的简便算法，会读写乘法算式', steps:[
    {title:'先数「几个几」',body:'相同加数连加才能写成乘法。先观察加数是否相同，再数一数有几个。',action:'把连加算式改写成「几个几」，再说成乘法算式。',visualCue:'把相同加数圈起来，数个数。'},
    {title:'读写乘法算式',body:'4 个 3 相加写成 4×3 或 3×4，乘号前后交换结果一样。',action:'读出乘法算式，说出各部分名称。',visualCue:'乘号前后的数是「份数」和「每份个数」。'},
    {title:'回归加法检查',body:'乘法来自连加，用连加验证：4×3 就是 3+3+3+3。',action:'用加法算一遍，看结果和乘法是否一致。',visualCue:'把乘法「翻译」回连加。'}],
    chapter:'乘法的初步认识', entry:'先确认加数相同，数出「几个几」，再改写成乘法。', avoid:'改写前先检查加数是否相同；读写算式对齐「几个几」。', cue:'看到相同加数连加，就数「几个几」。', factNodes:[{id:'sj-multi-mean',label:'乘法的意义（几个几）'},{id:'sj-multi-read',label:'乘法算式的读写'}] },
  'sj2a-unit3-multiply2':{ restatementPrompt:'请复述：哪句口诀能同时算 2×6 和 6×2？为什么？', objective:'熟记 2～6 的乘法口诀，能用一句口诀算两道乘法并解决实际问题', steps:[
    {title:'找口诀的规律',body:'2 的口诀每次加 2；5 的口诀结果总是 0 或 5 结尾。理解了规律就不易忘。',action:'按顺序背 2 和 5 的口诀，说说发现了什么规律。',visualCue:'口诀表里相邻结果差同一个数。'},
    {title:'一句口诀两道算式',body:'三五十五，既能算 3×5 也能算 5×3。',action:'任选一句口诀，写出对应的两道乘法算式。',visualCue:'口诀的两个数交换位置，结果不变。'},
    {title:'用口诀解决问题',body:'一双筷子 2 根，6 口人要几根？想「二六十二」马上知道是 12 根。',action:'举一个生活里用口诀算的例子。',visualCue:'先写乘法算式，再想口诀。'}],
    chapter:'表内乘法（一）', entry:'先确认「几个几」，再想对应乘法口诀求积。', avoid:'改写乘法前先检查加数是否相同；读口诀对齐两个乘数。', cue:'看到相同加数连加，就数「几个几」。', factNodes:[{id:'sj-multi-mean',label:'乘法的意义（几个几）'},{id:'sj-multi-recipe',label:'2～6 乘法口诀'}] },
  'sj2a-unit4-length':{ restatementPrompt:'请复述：1 米等于多少厘米？量短的物体用什么单位？', objective:'认识厘米和米，会正确测量并合理选择长度单位', steps:[
    {title:'认识刻度尺',body:'刻度尺上有数字和刻度线，刻度 0 是测量的起点。',action:'指出尺子上的刻度 0。',visualCue:'0 刻度用红笔圈出。'},
    {title:'用厘米量',body:'物体一端对准 0，尺子放平，另一端对着几就是几厘米。厘米量短的：铅笔、橡皮。',action:'说出量物体时尺子怎么放、看哪里。',visualCue:'一端对 0 的示意图。'},
    {title:'米与选单位',body:'1 米=100 厘米；量黑板、教室用米。听到「铅笔 18 米」要能发现不对劲。',action:'判断两个物体的长度该用厘米还是米。',visualCue:'短的标厘米，长的标米。'}],
    chapter:'厘米和米', entry:'先想物体长短：短的用厘米，长的用米；测量时一端对准 0。', avoid:'尺子别歪放；单位别混用——数据不合理要回头检查。', cue:'量长度先选单位：短厘米、长米，一端对 0 再读数。', factNodes:[{id:'sj-length-cm',label:'厘米与测量方法'},{id:'sj-length-m',label:'1 米=100 厘米'}] },
  /* 四 表内除法（一）——平均分与除法初步认识 */
  'sj2a-unit4-division':{ restatementPrompt:'请复述：什么叫平均分？12÷3=4 里的三个数各表示什么？', objective:'理解平均分的含义，认识除号会读算式，会用 1～6 的乘法口诀求商', steps:[
    {title:'认识平均分',body:'每份分得同样多，才叫平均分。把 8 块饼干分给 2 人，每人 4 块——这就是平均分。',action:'判断一种分法是不是平均分，说说理由。',visualCue:'同样多的几份用圈圈起来。'},
    {title:'认识除法算式',body:'平均分可以用除法表示：8÷2=4，读作「8 除以 2 等于 4」。除号前面是总数，后面是份数，等号后是每份个数。',action:'说出除法算式里每个数表示什么。',visualCue:'用箭头把数和含义连起来。'},
    {title:'口诀求商',body:'除法用乘法口诀算最快：12÷3 想「三四十二」，商是 4。乘法和除法是一对好朋友。',action:'说出你用哪句口诀求商。',visualCue:'把口诀写在算式旁边。'}],
    chapter:'表内除法（一）', entry:'先确认是平均分，再列除法算式，用乘法口诀求商。', avoid:'列式前先分清总数、份数、每份个数，别把位置写反。', cue:'看到平均分就用除法：总数÷份数=每份个数。', factNodes:[{id:'sj2a-divide-mean',label:'平均分的含义'},{id:'sj2a-divide-sign',label:'除号与算式读法'},{id:'sj2a-divide-recipe',label:'1～6 口诀求商'}] },
  /* 六 表内乘法和表内除法（二）——7～9 口诀与乘除混合 */
  'sj2a-unit6-recipe7to9':{ restatementPrompt:'请复述：7 的乘法口诀怎么背？一句口诀能算几道题？', objective:'熟记 7～9 的乘法口诀，会用口诀求积求商，会算连乘连除和乘除混合', steps:[
    {title:'7～9 的口诀',body:'7 的口诀每次加 7，8 的每次加 8，9 的每次加 9。9 的口诀有巧记法：9×3=27，积的十位比乘数少 1（2），个位凑够 9（7）。',action:'按顺序背 7 的口诀，说说相邻两句差几。',visualCue:'口诀表相邻结果差同一个数。'},
    {title:'一句口诀四道算式',body:'七八五十六：能算 7×8、8×7、56÷7、56÷8 四道题。乘除是一家。',action:'任选一句口诀，写出对应的四道算式。',visualCue:'口诀的四个数在算式间连线。'},
    {title:'连乘连除和混合',body:'连乘连除从左往右算：2×3×4 先算 2×3=6，再算 6×4=24。乘除混合也按从左往右。',action:'算一道连乘题，说出先算哪一步。',visualCue:'用横线标出当前算的一段。'}],
    chapter:'表内乘法和表内除法（二）', entry:'先想对应口诀，再按从左往右的顺序算。', avoid:'连乘连除别跳步，每一步写清中间结果。', cue:'一句口诀四道题，连乘连除从左往右。', factNodes:[{id:'sj2a-recipe-789',label:'7～9 乘法口诀'},{id:'sj2a-recipe-divide',label:'用口诀求商'},{id:'sj2a-chain-muldiv',label:'连乘连除与混合'}] },
  /* 七 观察物体——从不同位置看物体 */
  'sj2a-unit7-observe':{ restatementPrompt:'请复述：从前面和从侧面看同一个物体，看到的形状一样吗？', objective:'能从前、后、左、右不同位置观察物体，说出看到的不同形状', steps:[
    {title:'站在不同位置看',body:'同一个物体，站在不同位置看到的形状可能不一样。站在正面看到正面，站在侧面看到侧面。',action:'说出你站在物体的哪一面，看到什么形状。',visualCue:'用箭头标出观察的位置。'},
    {title:'前后左右四个方向',body:'从前、后、左、右四个方向观察，每次只看到一面。前后看到的常常相反，左右看到的也常常相反。',action:'按顺序说出四个方向各看到什么。',visualCue:'四个方向画成十字箭头。'},
    {title:'根据形状猜位置',body:'看到正面图，就知道观察者在正面；看到侧面图，观察者就在侧面。反过来也能推。',action:'看一张形状图，猜猜观察者站在哪里。',visualCue:'形状图和方向箭头配对。'}],
    chapter:'观察物体', entry:'先确定观察的位置，再说看到的形状；不同位置看到的可能不同。', avoid:'别把「看到的样子」和「物体本来的样子」混起来。', cue:'看物体先问：站在哪个方向看？', factNodes:[{id:'sj2a-observe-position',label:'观察位置与形状'},{id:'sj2a-observe-four',label:'前后左右四个方向'}] },
  /* 八 期末复习——二上综合复习 */
  'sj2a-unit8-review':{ restatementPrompt:'请复述：这学期学的加减法、乘除法、长度单位，哪一块你最容易错？', objective:'复习 100 以内加减法、表内乘除法、厘米和米、图形与观察物体，查漏补缺', steps:[
    {title:'加减法查漏',body:'两位数加减先看个位：满十进 1，不够减退 1。做完用加减互逆验算一遍。',action:'挑一道做错的加减题，重新算并验算。',visualCue:'竖式数位对齐，进位退位标出来。'},
    {title:'乘除法查漏',body:'乘除法都靠口诀：想「几个几」用乘法，平均分用除法，求商想口诀。',action:'说出三句你最熟的口诀，各算一道乘法和一道除法。',visualCue:'口诀与算式配对连线。'},
    {title:'单位与图形查漏',body:'长度单位要选对：短的用厘米、长的用米，1 米=100 厘米；图形要会数边和角，平行四边形对边平行且相等。',action:'判断两个物体该用什么单位，指出一个平行四边形的对边。',visualCue:'短标厘米、长标米，对边用同色标注。'}],
    chapter:'期末复习', entry:'按模块逐项自查：加减法看进位退位，乘除法想口诀，单位看长短。', avoid:'复习别只刷题，先找出自己最常错的那一类。', cue:'复习先定位薄弱模块，再针对性练。', factNodes:[{id:'sj2a-review-addsub',label:'加减法复习'},{id:'sj2a-review-muldiv',label:'乘除法复习'},{id:'sj2a-review-unit',label:'单位与图形复习'}] },
};
export const sjGrade2aTextbook:Textbook={ textbookId:'sj-math-2a-original', title:'数学小侦探·二年级上（苏教版对齐）', grade:'二年级', subject:'数学', edition:'原创对齐版 1.0', origin:'original-demo', rightsStatus:'authorized-demo', attribution:{sourceName:'对齐苏教版二年级上册教学单元 · 内容为原创示例',licenseNote:'单元结构对齐公开教学大纲；正文与题目为原创编写，不含出版社图文',version:'1.0.0'}, lessons:[
{lessonId:'sj2a-unit1-addsub',title:'100 以内的加法和减法（三）：进位与退位', outline:['列竖式对齐数位','个位满十进 1','个位不够减退 1','加减互逆验算'],pages:[
'列竖式计算两位数加两位数时，相同数位要对齐。个位相加满十，别忘向十位进 1。比如 47+28：先算个位 7+8=15，个位写 5 向十位进 1；十位 4+2 再加进上来的 1 等于 7，结果是 75。',
'两位数减两位数遇到「不够减」怎么办？个位不够减，从十位退 1 当 10 再减。比如 52-37：个位 2 减 7 不够，向十位借 1，变成 12-7=5；十位上 5 退了 1 剩 4，4-3=1，结果是 15。做完别忘了验算：差加减数要等于被减数。',
'口算也有巧办法：凑整。算 63+28，可以先把 28 拆成 7 和 21，63 加 7 凑成整十的 70，再加 21 得 91。凑整十能让我们心算更快、更不容易错。']}, 
{lessonId:'sj2a-unit1-practice',title:'100 以内加减法：连加连减与验算', outline:['连加从左往右算','连减逐次减','换算顺序凑整','验算防抄错数'],pages:[
'连加连减要按从左往右的顺序一步一步算。比如 28+34+25：先算 28+34=62，再算 62+25=87。每一步都写清结果，就不容易乱。',
'计算 90-45-28：先算 90-45=45，再算 45-28=17。如果发现个位要连着两次退位，就要更小心：每借一次，十位都要减掉 1。',
'验算是检查答案的好帮手。减法用「差+减数=被减数」验算；加法用「和-一个加数=另一个加数」验算。养成验算习惯，计算正确率会大大提高。']},
{lessonId:'sj2a-unit2-quadrilateral',title:'平行四边形的初步认识', outline:['认一认四边形','找平行的一组对边','拼一拼平行四边形','生活中的平行四边形'],pages:[
'我们认识过的长方形、正方形，加上新朋友——平行四边形，都是四边形：它们都有 4 条边和 4 个角。平行四边形的样子像被「推歪」的长方形。',
'平行四边形有个神奇的本领：容易变形。用吸管或小棒做出一个平行四边形框架，拉一拉，它的形状会变，但 4 条边长度不变。生活中的伸缩衣架、电动伸缩门就用了这个原理。',
'找一找身边的平行四边形：楼梯扶手、篱笆格子、停车标志里都藏着它。判断时抓住两条：4 条边、对边一样长且平行。']},
{lessonId:'sj2a-unit3-multiply1',title:'表内乘法（一）：乘法的初步认识', outline:['相同加数连加','改写成乘法算式','乘法算式各部分名称','把生活问题写成乘法'],pages:[
'相同加数连加，可以用乘法表示得又快又清楚。4 个 2 相加写成加法是 2+2+2+2=8，写成乘法就是 2×4=8（或 4×2=8）。乘号两边的数交换位置，结果不变。',
'乘号「×」表示「几个几」。3×5 读作「3 乘 5」，表示 3 个 5 相加或 5 个 3 相加。看到连加算式，先数清楚「几个几」，就能写出乘法算式。',
'把加法改写成乘法有一个前提：加数必须相同。5+5+5+5 可以写成 5×4；但 4+5+5+4 加数不同，就不能直接写乘法。先观察，再改写。']},
{lessonId:'sj2a-unit3-multiply2',title:'表内乘法（一）：2～6 的乘法口诀', outline:['2 的口诀：每次加 2','5 的口诀：结果 0 或 5 结尾','口诀算两道乘法','用口诀解决问题'],pages:[
'乘法口诀是帮我们记住乘法结果的「口令」。三五十五，意思是 3×5=15、5×3=15——一句口诀能算两道乘法题。',
'记口诀有方法：2 的口诀就是每次加 2（2、4、6、8、10……）；5 的口诀结果总是 5 或 0 结尾。口诀之间是有规律的，理解了规律就不容易忘。',
'口诀用得好，解决问题就快：一双筷子 2 根，6 口人要用几根？想「二六十二」，马上知道要 12 根。学口诀是为了用起来。']},
{lessonId:'sj2a-unit4-division',title:'表内除法（一）：平均分与除法', outline:['认识平均分','除号与算式读法','用 1～6 的口诀求商'],pages:[
'把 8 块饼干分给 2 个小朋友，每人同样多，都是 4 块——这样的分法叫「平均分」。每份分得同样多，才叫平均分。',
'平均分可以用除法算式表示：8÷2=4，读作「8 除以 2 等于 4」。除号前面的数是要分的总数，后面的数是平均分的份数，等号后面是每份的个数。',
'求商的小帮手还是乘法口诀：12÷3 想「三四十二」，商就是 4。乘法和除法是一对好朋友，除法用乘法口诀算得又快又准。']},
{lessonId:'sj2a-unit4-length',title:'厘米和米：长度单位与测量', outline:['认识刻度尺','厘米量物体','米与厘米的关系','选对单位'],pages:[
'量长度要用尺子。刻度尺上有数字和长短线，刻度 0 是起点。量的时候把物体的一端对准 0，另一端对着几，就是几厘米。',
'厘米是较小的长度单位，量铅笔、橡皮、课本的边都用它。比如一支铅笔大约 18 厘米。量的时候尺子要放平，眼睛看着刻度，别歪着量。',
'量黑板、教室的长，用厘米就太麻烦了，要用更大的单位——米。1 米=100 厘米。米尺、卷尺上都标着「米」。小朋友张开双臂，两手间的距离大约就是 1 米。',
'选单位的小窍门：量短的用厘米，量长的用米。说不合理的数据也要敏感：铅笔长 18 米？黑板长 4 厘米？一听就不对劲，要回头检查。']},
{lessonId:'sj2a-unit6-recipe7to9',title:'表内乘法和表内除法（二）：7～9 的口诀', outline:['7～9 的乘法口诀','一句口诀四道算式','连乘连除和乘除混合'],pages:[
'7 的乘法口诀每次加 7：一七得七、二七十四、三七二十一……8 的每次加 8，9 的每次加 9。理解了「每次加几」，口诀就不容易忘。',
'一句口诀能算四道题：七八五十六，可以算 7×8、8×7、56÷7、56÷8。乘法和除法共用一套口诀。',
'连乘连除从左往右算：2×3×4 先算 2×3=6，再算 6×4=24。乘除混合也按从左往右的顺序，每一步写清中间结果。']},
{lessonId:'sj2a-unit7-observe',title:'观察物体：从前、后、左、右看', outline:['站在不同位置看','前后左右四个方向','根据形状猜位置'],pages:[
'同一个物体，站在不同位置看到的形状可能不一样。站在正面看到正面，站在侧面看到侧面。',
'从前、后、左、右四个方向观察，每次只看到一面。前后看到的常常相反，左右看到的也常常相反。',
'看到正面图，就知道观察者在正面；看到侧面图，观察者就在侧面。看到什么形状，能反过来推站在哪里。']},
{lessonId:'sj2a-unit8-review',title:'期末复习：加减、乘除、单位与图形', outline:['加减法查漏','乘除法查漏','单位与图形查漏'],pages:[
'两位数加减先看个位：满十进 1，不够减退 1。做完用加减互逆验算一遍，养成检查习惯。',
'乘除法都靠口诀：想「几个几」用乘法，平均分用除法，求商想口诀。乘除是一家。',
'长度单位要选对：短的用厘米、长的用米，1 米=100 厘米；图形要会数边和角，平行四边形对边平行且相等。复习先找自己最常错的模块，再针对性练。']}]};

export const sjTextbooks:Textbook[]=[sjGrade2aTextbook];

/* ========== 语文二年级上册（统编版对齐）==========
   单元框架对齐统编版二上公开教学单元；课文导读与练习为本项目原创编写，不含出版社图文。 */
export const ywGrade2aTextbook:Textbook={ textbookId:'yw-2a-original', title:'阅读小苗·二年级上（统编版对齐）', grade:'二年级', subject:'语文', edition:'原创对齐版 1.0', origin:'original-demo', rightsStatus:'authorized-demo', attribution:{sourceName:'对齐统编版二年级上册教学单元 · 内容为原创示例',licenseNote:'单元结构对齐公开教学大纲；课文导读与练习为原创编写，不含出版社图文',version:'1.0.0'}, lessons:[
{lessonId:'yw2a-unit1-reading',title:'课文阅读：抓关键词读懂一句话', outline:['找出生字词','抓住关键词','连起来说句意'],pages:[
'读懂一句话的秘诀：先找出句子里的生字词，读准它们；再想一想，哪个词最重要？把重要的词圈出来，句子的意思就清楚了。',
'比如「小松鼠把秋天藏进了松果里」这句话：圈出「藏」，想一想——松果怎么会有秋天？原来是松鼠在秋天储存松果过冬。抓住一个词，读懂一句话。',
'试着用这个方法读课文：先读准，再圈词，最后用自己的话说一说。说的时候别背原句，换成自己的话才说明真的读懂了。']},
{lessonId:'yw2a-unit2-sentences',title:'句子练习：把话说完整、说生动', outline:['谁+在做什么','加上「怎么样」','用比喻让句子活起来'],pages:[
'把话说完整，要有「谁」和「做什么」：小鸟飞、小明写字。再进一步，加上「怎么样」：小鸟快乐地飞、小明认真地写字。句子马上就生动了。',
'让句子活起来的另一个办法是打比方：「月亮弯弯的，像一只小船」「红红的苹果像妹妹的脸蛋」。比方的两边要有相似的地方，不能乱比。',
'练一练：把「太阳升起来了」这句话说生动。可以说「太阳慢慢地从山后爬起来了」，也可以说「太阳像个红气球，从山后升了起来」。说的和别人不一样，才是好句子。']},
{lessonId:'yw2a-unit3-story',title:'看图讲故事：按顺序说清楚', outline:['先看整体','按顺序说','加上想法'],pages:[
'看图讲故事，先看整体：图上是什么时间、什么地方、有谁？再按顺序看：先发生了什么，接着怎么样，最后怎样了。',
'讲故事的小法宝：用上「先……接着……然后……最后……」，听起来就有条有理。别忘了说清「为什么」，让听的人明白道理。',
'说给别人听，是最棒的练习。说完了问一问：我讲清楚了吗？漏了什么？下一次讲得更好。']},
{lessonId:'yw2a-unit4-scenery',title:'古诗与写景：抓住景物特点', outline:['读通顺','找景物特点','想象画面'],pages:[
'读古诗先读通顺，再想画面。「白日依山尽，黄河入海流」——太阳靠着山慢慢落下，黄河向着大海奔流，两句就是一幅画。',
'写景的文章要抓住景物的特点：黄山奇石「奇」在哪？日月潭「美」在哪？找出最能表现特点的句子，圈出关键词。',
'读景物的文章可以边读边想象：颜色、形状、声音、动静。把想到的画面说给别人听，就是读懂了。']},
{lessonId:'yw2a-unit5-fable',title:'寓言故事：读懂藏在故事里的道理', outline:['读故事','想因果','说道理'],pages:[
'寓言故事短小，却藏着道理。《坐井观天》里青蛙只看到井口那么大的天，《寒号鸟》里寒号鸟总说明天就做窝——它们都错在只看眼前。',
'读寓言要想三件事：故事里的人物做了什么？结果怎样？为什么会这样？把这三个问题想清楚，道理就浮出来了。',
'道理常常藏在最后一句，也可能要自己总结。读完用自己的话说说：这个故事告诉我什么？']},
{lessonId:'yw2a-unit6-hero',title:'伟人故事：按顺序复述', outline:['理清顺序','抓住细节','完整复述'],pages:[
'写人物的故事常按事情发展的顺序写：先发生什么，接着怎样，最后结果如何。读的时候理清顺序，就不容易乱。',
'《大禹治水》里大禹三次路过家门都没有进去；《朱德的扁担》里朱德和战士们一起挑粮。抓住这些具体的事，人物就立起来了。',
'复述故事可以用「先……接着……然后……最后……」，还可以加上「为什么」，让听的人明白这件事的意义。']},
{lessonId:'yw2a-unit7-imagine',title:'想象世界：古诗与童话中的想象', outline:['找出想象','分辨真假','体会妙处'],pages:[
'「危楼高百尺，手可摘星辰」——楼高得能摘到星星，这是诗人的想象。古诗常用夸张的想象写出奇特的感觉。',
'《雾在哪里》把雾当成人来写，雾会藏东西；《雪孩子》里雪孩子会跑会救人。把物当人写，故事就有了生命。',
'读想象的故事，要分清哪些是真实的、哪些是想象的，再想想作者为什么这样想象——想象是为了把感受写得更真切。']},
{lessonId:'yw2a-unit8-animal',title:'动物故事：读对话懂性格', outline:['读对话','看提示语','想对错'],pages:[
'动物故事里，动物会说话、会思考。读对话就能看出它们是什么性格：《狐假虎威》里狐狸狡猾，《纸船和风筝》里小熊和松鼠真诚。',
'读对话要注意提示语：狐狸「神气活现」地说，松鼠「高兴」地喊。提示语里的词，就是性格的线索。',
'读完后想一想：这些动物的做法对不对？如果是你，你会怎么做？']}]};
/* 语文学习包：复述提示/微课堂三步/错题章节（章节为语文通用分类），供引擎按 lessonId 取用 */
export interface YwLessonPack{ restatementPrompt:string; objective:string; steps:Array<{title:string;body:string;action:string;visualCue:string}>; chapter:string; entry:string; avoid:string; cue:string; factNodes:Array<{id:string;label:string}>; }
export const ywLessonPacks:Record<string,YwLessonPack>={
  'yw2a-unit1-reading':{ restatementPrompt:'请复述：读懂一句话，先做什么再做什么？', objective:'会用「读准—圈词—说句意」三步读懂一句话', steps:[
    {title:'读准生字词',body:'先把句子里的生字词读准，读通顺，才谈得上理解。',action:'指出句子里的生字词并读一读。',visualCue:'给生字词加拼音。'},
    {title:'圈出关键词',body:'想一想句子里哪个词最重要，把它圈出来。抓关键词是读懂句子的捷径。',action:'圈出你认为最重要的词，说说为什么。',visualCue:'关键词用圆圈标出。'},
    {title:'说出句意',body:'用自己的话把句子的意思说出来，不背原句。',action:'用自己的话说说这句话讲了什么。',visualCue:'用自己的话=换说法。'}],
    chapter:'阅读理解', entry:'先读准字词，再圈关键词，最后用自己的话说句意。', avoid:'别跳过生字词直接猜意思；说句意时不照背原句。', cue:'读句子先圈关键词，意思藏在这个词里。', factNodes:[{id:'yw-read-steps',label:'读准—圈词—说句意'},{id:'yw-key-word',label:'关键词抓句意'}] },
  'yw2a-unit2-sentences':{ restatementPrompt:'请复述：把话说完整的两个部分是什么？打比方要注意什么？', objective:'会把话说完整、说生动，会用有相似点的比喻', steps:[
    {title:'说完整',body:'一句话要有「谁」和「做什么」：小鸟飞。',action:'判断一句话缺了「谁」还是「做什么」。',visualCue:'谁和做什么用两色标注。'},
    {title:'说生动',body:'加上「怎么样」：小鸟快乐地飞。句子马上有画面了。',action:'给句子加上「怎么样」的部分。',visualCue:'修饰词用波浪线标出。'},
    {title:'打比方',body:'比方的两边要有相似点：月亮和小船都是弯弯的。',action:'用一个比喻句，说出两边哪里像。',visualCue:'相似点画连线。'}],
    chapter:'句子与表达', entry:'先补齐「谁+做什么」，再加「怎么样」或打比方让句子生动。', avoid:'打比方不能乱比，两边要有相似点。', cue:'说话先求完整再加生动，比喻要抓相似点。', factNodes:[{id:'yw-complete',label:'谁+做什么'},{id:'yw-vivid',label:'生动与比喻'}] },
  'yw2a-unit3-story':{ restatementPrompt:'请复述：看图讲故事，按什么顺序说？', objective:'能按顺序、有条理地看图讲故事并说清想法', steps:[
    {title:'先看整体',body:'看图先看整体：什么时间、什么地方、有谁。',action:'说出图上的时间、地点、人物。',visualCue:'整体信息填三格。'},
    {title:'按顺序讲',body:'用「先……接着……然后……最后……」把图意连起来说。',action:'用顺序词连着说一遍图意。',visualCue:'顺序词做成台阶图。'},
    {title:'加上想法',body:'讲完事情说一说你的想法或明白的道理。',action:'说一句你从这个故事里明白了什么。',visualCue:'想法放进对话框。'}],
    chapter:'口语表达', entry:'先看整体再按顺序讲，最后加上自己的想法。', avoid:'讲的时候别东一句西一句，顺序词帮你理条理。', cue:'看图讲故事：整体—顺序—想法，三步走。', factNodes:[{id:'yw-whole',label:'先看整体'},{id:'yw-order',label:'顺序词讲条理'}] },
  'yw2a-unit4-scenery':{ restatementPrompt:'请复述：读写景的文章，先做什么再做什么？', objective:'能读通古诗，抓住景物特点，边读边想象画面', steps:[
    {title:'读通顺',body:'读古诗和写景文章，先把字音读准、句子读顺，才谈得上理解。',action:'读一遍古诗，标出不认识的字。',visualCue:'生字加拼音。'},
    {title:'找景物特点',body:'写景的文章都在写「特点」：黄山奇石的「奇」、日月潭的「美」。找出最能表现特点的句子。',action:'圈出写景物特点的关键词。',visualCue:'特点词加方框。'},
    {title:'想象画面',body:'边读边想：颜色、形状、声音、动静。把想到的画面说给别人听。',action:'说说你读这句时想到了什么画面。',visualCue:'画面放进画框里。'}],
    chapter:'古诗与写景', entry:'先读通顺，再找景物特点，最后想象画面。', avoid:'读古诗别只背不理解，先想画面再记句子。', cue:'读景先找特点词，边读边想画面。', factNodes:[{id:'yw2a-scenery-read',label:'读通顺'},{id:'yw2a-scenery-feature',label:'抓景物特点'},{id:'yw2a-scenery-imagine',label:'想象画面'}] },
  'yw2a-unit5-fable':{ restatementPrompt:'请复述：读寓言故事要想哪三个问题？', objective:'能读懂寓言故事，理清因果，说出故事里的道理', steps:[
    {title:'读故事',body:'寓言故事短小，先读清人物做了什么。青蛙坐在井里，寒号鸟总说明天做窝。',action:'说出故事里的人物做了什么。',visualCue:'人物和动作连线。'},
    {title:'想因果',body:'再想：结果怎样？为什么会这样？青蛙只看到井口的天，寒号鸟只顾眼前。',action:'说出故事的起因和结果。',visualCue:'原因和结果用箭头连起来。'},
    {title:'说道理',body:'道理常常藏在结尾，也可能要自己总结。用自己的话说说这个故事告诉我们什么。',action:'用一句话说出故事的道理。',visualCue:'道理放进对话框。'}],
    chapter:'寓言故事', entry:'先读故事，再想因果，最后说道理。', avoid:'道理别照抄原文，用自己的话说才说明真懂。', cue:'读寓言想三问：做了什么、结果怎样、为什么。', factNodes:[{id:'yw2a-fable-read',label:'读故事'},{id:'yw2a-fable-cause',label:'想因果'},{id:'yw2a-fable-moral',label:'说道理'}] },
  'yw2a-unit6-hero':{ restatementPrompt:'请复述：复述人物故事可以用哪些顺序词？', objective:'能理清人物故事的顺序，抓住细节，完整复述', steps:[
    {title:'理清顺序',body:'写人物的故事按事情发展顺序写：先发生什么，接着怎样，最后如何。',action:'说出故事先讲了什么、最后讲了什么。',visualCue:'顺序画成台阶。'},
    {title:'抓住细节',body:'大禹三次过家门没进去，朱德和战士一起挑粮——具体的事最能看出人物的品质。',action:'说出一个让你印象最深的细节。',visualCue:'细节句加下划线。'},
    {title:'完整复述',body:'用「先……接着……然后……最后……」把故事讲一遍，再加上「为什么」。',action:'按顺序复述这个故事。',visualCue:'顺序词做成台阶图。'}],
    chapter:'伟人故事', entry:'先理清顺序，再抓细节，最后按顺序完整复述。', avoid:'复述别丢关键情节，也别照背原文。', cue:'复述故事：顺序词打头，细节不能丢。', factNodes:[{id:'yw2a-hero-order',label:'理清顺序'},{id:'yw2a-hero-detail',label:'抓住细节'},{id:'yw2a-hero-retell',label:'完整复述'}] },
  'yw2a-unit7-imagine':{ restatementPrompt:'请复述：读想象的故事，要分清什么？想象是为了什么？', objective:'能找出文中的想象，分辨真实与想象，体会想象的妙处', steps:[
    {title:'找出想象',body:'「手可摘星辰」是想象，「雾把大海藏起来」是想象。找出文中哪些句子不是真的。',action:'指出一句你觉得是想象的话。',visualCue:'想象句加星号。'},
    {title:'分辨真假',body:'分清哪些是真实发生的、哪些是作者想象的。楼不会真的高到摘星，雾不会真的「藏」东西。',action:'判断一句话是真实还是想象。',visualCue:'真实和想象分两栏。'},
    {title:'体会妙处',body:'想象是为了把感受写得更真切：夸张的想象让高楼更高，拟人的想象让雾有了脾气。',action:'说说作者这样想象好在哪里。',visualCue:'妙处写在小灯泡旁。'}],
    chapter:'想象世界', entry:'先找出想象，再分辨真假，最后体会想象的妙处。', avoid:'别把想象当成事实，读时心里要分清。', cue:'读想象故事：先找想象，再想为什么这样想。', factNodes:[{id:'yw2a-imagine-find',label:'找出想象'},{id:'yw2a-imagine-distinguish',label:'分辨真假'},{id:'yw2a-imagine-effect',label:'体会妙处'}] },
  'yw2a-unit8-animal':{ restatementPrompt:'请复述：读动物故事，从哪里能看出动物的性格？', objective:'能通过对话和提示语读懂动物性格，判断做法对错', steps:[
    {title:'读对话',body:'动物故事里动物会说话。读它们说的话，就能看出性格：狐狸狡猾、松鼠真诚。',action:'读一段对话，说说这是谁在说话。',visualCue:'对话用引号标出。'},
    {title:'看提示语',body:'提示语里的词是性格的线索：狐狸「神气活现」地说，松鼠「高兴」地喊。',action:'圈出提示语里表现性格的词。',visualCue:'提示语加波浪线。'},
    {title:'想对错',body:'读完后想一想：这些动物的做法对不对？如果是你，你会怎么做？',action:'说说你喜欢哪个动物，为什么。',visualCue:'对错打勾打叉。'}],
    chapter:'动物故事', entry:'先读对话，再看提示语，最后想想做法对不对。', avoid:'别只看故事好玩，要想人物的做法和道理。', cue:'读动物故事：对话看性格，提示语找线索。', factNodes:[{id:'yw2a-animal-dialogue',label:'读对话'},{id:'yw2a-animal-cue',label:'看提示语'},{id:'yw2a-animal-judge',label:'想对错'}] }};
export const ywQuizByLesson:Record<string,Quiz>={
  'yw2a-unit1-reading':{quizId:'yw2a-u1-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'读懂一句话，第一步应该做什么？',options:['把生字词读准','马上背下来','问家长意思'],expectedAnswer:'把生字词读准',rationale:'先读准字词，才能理解句意，这是读懂一句话的第一步。'},
{questionId:'y2',type:'fill',prompt:'「小松鼠把秋天藏进了松果里」，抓住「____」这个词，就能明白句子的意思。',expectedAnswer:'藏',rationale:'「藏」是关键词：松鼠储存松果过冬，秋天就「藏」在里面。'},
{questionId:'y3',type:'steps',prompt:'用自己的话说说「月亮弯弯的，像一只小船」把什么比作什么，为什么要这样比。',expectedAnswer:'把月亮比作小船，因为它们都是弯弯的，这样写更生动',rationale:'比方的两边要有相似点：月亮和小船都是弯弯的，比喻让句子更生动。',
 keyPointLabels:['比什么','相似点','作用'],
 keyPoints:[['月亮'],['弯','小船','船'],['生动','形象','更美']]}]},
  'yw2a-unit2-sentences':{quizId:'yw2a-u2-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'「小鸟飞」这句话不完整，补上哪个词就完整又生动了？',options:['小鸟快乐地飞','小鸟','飞走了吗'],expectedAnswer:'小鸟快乐地飞',rationale:'加上「怎么样」（快乐地），句子既完整又生动。'},
{questionId:'y2',type:'fill',prompt:'打比方要有____点：月亮和小船的相似点是「弯弯的」。',expectedAnswer:'相似',rationale:'比方的两边要有相似的地方，不能乱比。'},
{questionId:'y3',type:'steps',prompt:'把「太阳升起来了」说成一句生动的话，并说说你用了什么办法。',expectedAnswer:'示例：太阳像个红气球升起来了，用了打比方的办法',rationale:'用打比方或加修饰词的办法都能让句子变生动，关键要说清用了什么办法。',
 keyPointLabels:['生动句子','办法'],
 keyPoints:[['太阳'],['像','慢慢','爬','红','比喻','比方'],['办法','方法','用了']]}]},
  'yw2a-unit3-story':{quizId:'yw2a-u3-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'看图讲故事，第一步先看什么？',options:['图上整体：时间、地点、人物','随便挑一个细节','直接说结论'],expectedAnswer:'图上整体：时间、地点、人物',rationale:'先看整体再按顺序看细节，讲出来才有条理。'},
{questionId:'y2',type:'fill',prompt:'用「先……接着……然后……____……」可以把故事讲得有条理。',expectedAnswer:'最后',rationale:'「先、接着、然后、最后」是按顺序讲话的小法宝。'},
{questionId:'y3',type:'steps',prompt:'讲完故事后，怎样知道自己讲得好不好？说出至少两个办法。',expectedAnswer:'问听的人我讲清楚了吗、检查有没有漏掉内容，下次改进',rationale:'主动请听众反馈、自查遗漏，是讲故事进步的好办法。',
 keyPointLabels:['听反馈','自查'],
 keyPoints:[['问','听','别人'],['漏','缺','漏掉','检查','清楚']]}]},
  'yw2a-unit4-scenery':{quizId:'yw2a-u4-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'读写景的文章，第一步应该做什么？',options:['先读通顺','先背下来','先做后面的题'],expectedAnswer:'先读通顺',rationale:'先把字音读准、句子读顺，才能理解内容。'},
{questionId:'y2',type:'fill',prompt:'写景的文章都在写景物的____，找出最能表现它的句子就抓住了重点。',expectedAnswer:'特点',rationale:'抓景物特点，是读写景文章的关键。'},
{questionId:'y3',type:'steps',prompt:'读「白日依山尽，黄河入海流」时，你脑子里出现了什么画面？说说你是怎么想出来的。',expectedAnswer:'太阳靠着山慢慢落下，黄河向着大海奔流；从「依山尽」「入海流」这些词想象出来的',rationale:'边读边想象：抓住诗句里的动作词，想颜色、形状、动静。',
 keyPointLabels:['画面','依据'],
 keyPoints:[['太阳','日','山'],['黄河','海','流'],['词','依山','入海','想象']]}]},
  'yw2a-unit5-fable':{quizId:'yw2a-u5-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'读寓言故事，要想着重回答哪三个问题？',options:['做了什么、结果怎样、为什么','谁写的、什么时候写的、写在哪','有几个字、几个词、几个句子'],expectedAnswer:'做了什么、结果怎样、为什么',rationale:'读寓言要理清人物做了什么、结果如何、为什么，道理就浮出来了。'},
{questionId:'y2',type:'fill',prompt:'《坐井观天》里的青蛙只看到井口那么大的天，错在只看____。',expectedAnswer:'眼前',rationale:'青蛙坐在井里只能看到一小块天，比喻眼界狭小、只看眼前。'},
{questionId:'y3',type:'steps',prompt:'《寒号鸟》这个故事告诉我们什么道理？用自己的话说一说。',expectedAnswer:'不能只顾眼前、总把事情推到明天，要及早行动',rationale:'寒号鸟总说「明天就做窝」，最后冻死了，说明拖延不行动的危害。',
 keyPointLabels:['道理','表述'],
 keyPoints:[['明天','拖','及时','马上','行动','早'],['道理','不能','要']]}]},
  'yw2a-unit6-hero':{quizId:'yw2a-u6-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'复述人物故事，用哪组词能理清顺序？',options:['先、接着、然后、最后','因为、所以、但是','一二三四'],expectedAnswer:'先、接着、然后、最后',rationale:'「先……接着……然后……最后……」是按顺序复述的好帮手。'},
{questionId:'y2',type:'fill',prompt:'《大禹治水》里大禹三次路过家门都没有____。',expectedAnswer:'进去',rationale:'大禹三次过家门而不入，体现他一心治水的品质。'},
{questionId:'y3',type:'steps',prompt:'复述一个人物故事时，为什么不能只说结果？说说你的理由。',expectedAnswer:'只说结果就听不出人物做了什么、为什么这样做，故事就没了过程和品质',rationale:'复述要讲清顺序和细节，才能让人明白人物的品质和事情的意义。',
 keyPointLabels:['理由','细节作用'],
 keyPoints:[['过程','细节','做了什么','顺序'],['品质','为什么','明白']]}]},
  'yw2a-unit7-imagine':{quizId:'yw2a-u7-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'「危楼高百尺，手可摘星辰」里，哪部分是想象？',options:['手可摘星辰','危楼','百尺'],expectedAnswer:'手可摘星辰',rationale:'楼再高也摘不到星星，「手可摘星辰」是夸张的想象。'},
{questionId:'y2',type:'fill',prompt:'读想象的故事，要分清哪些是真实的、哪些是____的。',expectedAnswer:'想象',rationale:'分清真实与想象，才能真正读懂故事。'},
{questionId:'y3',type:'steps',prompt:'作者为什么要写「手可摘星辰」这样的想象？说说你的理解。',expectedAnswer:'为了突出楼很高，让读者感受到那种奇特的感觉，比直接说「楼很高」更生动',rationale:'想象是为了把感受写得更真切、更生动。',
 keyPointLabels:['作用','效果'],
 keyPoints:[['高','突出','夸张'],['生动','真切','感觉','形象']]}]},
  'yw2a-unit8-animal':{quizId:'yw2a-u8-quiz-01',questions:[
{questionId:'y1',type:'choice',prompt:'读动物故事，从哪里能看出动物的性格？',options:['对话和提示语','封面','页数'],expectedAnswer:'对话和提示语',rationale:'读对话和提示语里的词，就能看出动物是什么性格。'},
{questionId:'y2',type:'fill',prompt:'狐狸「神气活现」地说，这里的「神气活现」是____语，能看出狐狸的性格。',expectedAnswer:'提示',rationale:'提示语里的词是性格的线索。'},
{questionId:'y3',type:'steps',prompt:'《狐假虎威》里的狐狸用了什么办法？你觉得它的做法对不对？说说理由。',expectedAnswer:'狐狸借着老虎的威风吓跑百兽；不对，因为它靠欺骗别人达到目的',rationale:'狐狸假借老虎的威势，欺骗老虎和百兽，做法不对。',
 keyPointLabels:['办法','判断与理由'],
 keyPoints:[['借','假','老虎','威风','骗'],['不对','不好','错'],['骗','欺骗','不诚实','诚实']]}]}};
export const ywLessonIdByQuiz:Record<string,string>=Object.fromEntries(Object.entries(ywQuizByLesson).map(([lessonId,quiz])=>[quiz.quizId,lessonId]));

/* ========== 语文二年级下册（统编版对齐）==========
   单元框架对齐统编版二下公开教学单元；课文导读与练习为本项目原创编写，不含出版社图文。 */
export const ywGrade2bTextbook:Textbook={ textbookId:'yw-2b-original', title:'阅读小苗·二年级下（统编版对齐）', grade:'二年级', subject:'语文', edition:'原创对齐版 1.0', origin:'original-demo', rightsStatus:'authorized-demo', attribution:{sourceName:'对齐统编版二年级下册教学单元 · 内容为原创示例',licenseNote:'单元结构对齐公开教学大纲；课文导读与练习为原创编写，不含出版社图文',version:'1.0.0'}, lessons:[
{lessonId:'yw2b-unit1-findinfo',title:'课文（一）春天：提取信息，从短文里找答案', outline:['读清问题','回原文定位','圈出答案依据'],pages:[
'做题先读问题，带着问题去读短文——知道要找什么，眼睛才会「搜索」。问题问「什么时候」，就盯表示时间的词；问「谁」，就盯人名。',
'找到相关的句子别急着写，先把那句话完整读一遍，再圈出能回答问题的词语。答案要「有据可查」，依据就在原文里。',
'回答时尽量用上原文的词，再补上自己的话把意思说完整。「因为……所以……」是说出依据的好帮手。']},
{lessonId:'yw2b-unit2-guess-words',title:'阅读方法：猜词义，联系上下文懂新词', outline:['读前后句','找近义或解释','代回去验证'],pages:[
'遇到不认识的词，先别查字典——读读它的前后句。词语不是孤单的，前后的句子常常在悄悄解释它。',
'找线索的办法：前后句里有没有意思相近的词？有没有「就是说」「也就是」这样的解释信号？有没有例子可以推想？',
'猜出意思后，把猜的意思代回句子里读一遍：通顺、合理，就说明猜对了。这个办法管用一辈子，越用越熟练。']},
{lessonId:'yw2b-unit2-care',title:'课文（二）关爱：从细节体会情感', outline:['读事情','找细节','体会情感'],pages:[
'写关爱的故事，都在写一件具体的事：雷锋叔叔帮助迷路的孩子，千人糕要很多人一起做。先读清事情，再体会情感。',
'情感藏在细节里：一个动作、一句话、一个眼神。「一匹出色的马」里妹妹骑在爸爸背上的笑，就是家人之间的爱。',
'读完后想一想：这件事让你感动在哪里？如果换成你，你会怎么做？']},
{lessonId:'yw2b-unit3-culture',title:'识字与传统：在词语中认识文化', outline:['读准字音','理解词义','联系文化'],pages:[
'识字课要先把字音读准、字形记牢。「神州谣」里的「神州」指中国，「传统节日」里的节日都有来历。',
'理解词义可以联系生活：你过年时做过什么？端午吃什么？把词语和自己的生活连起来，记得更牢。',
'很多词语背后是文化：算盘是祖先的发明，「贝」字原来表示钱。学词语也是了解我们的文化。']},
{lessonId:'yw2b-unit4-childhood',title:'童年生活：读出童真童趣', outline:['读趣事','找想象','说感受'],pages:[
'写童年的文章都很有趣：彩色的梦、沙滩上的童话、变成小虫子。读的时候要读出那份天真和快乐。',
'童趣常常来自想象：把梦涂成彩色，把沙滩上的城堡当成真的国家。找出这些想象，就能读懂童心。',
'读完后说说：哪件事让你想起自己的童年？把自己的感受说出来，就是和作者对话。']},
{lessonId:'yw2b-unit5-lesson',title:'寓言与道理：从故事中悟道理', outline:['读故事','想错在哪','说道理'],pages:[
'寓言故事里的人常常会犯错：《亡羊补牢》里羊丢了才修羊圈，《揠苗助长》里把禾苗拔高。先读清他们错在哪。',
'想清楚错误的后果：羊又丢了，禾苗枯死了。从后果往回推，就明白故事想告诉我们什么。',
'道理要能用在生活里：犯错后及时改正，做事不能违背规律。用自己的话把道理说出来。']},
{lessonId:'yw2b-unit6-nature',title:'自然与科学：读懂科普文章', outline:['读懂现象','找出道理','说出依据'],pages:[
'科普文章讲的是自然现象和科学道理：《雷雨》写下雨前后的变化，《要是你在野外迷了路》讲怎么用太阳和北极星辨方向。',
'读科普文要找出「为什么会这样」：雷雨前为什么闷？大树为什么能指方向？答案常常就在文章里。',
'读完后要能说出依据：不是「我觉得」，而是「文章里说」。这和大自然打交道一样，要有证据。']},
{lessonId:'yw2b-unit7-change',title:'改变故事：读懂成长与变化', outline:['读变化','想原因','说启示'],pages:[
'这类故事都在写「改变」：大象把耳朵竖起来又放下，蜘蛛开店一次次换招牌，小毛虫变成了蝴蝶。',
'想清楚为什么会变：大象听了别人的话，蜘蛛嫌麻烦，小毛虫努力长大。变化背后都有原因。',
'从变化里想启示：适合别人的不一定适合自己；坚持做对的事，慢慢就会变好。']},
{lessonId:'yw2b-unit8-myth',title:'神话与想象：感受奇特的想象', outline:['读神奇','找想象','想妙处'],pages:[
'神话故事充满神奇的想象：羿射下九个太阳，当世界年纪还小的时候万物会说话。读的时候要感受那份神奇。',
'找出文中不真实却让人觉得美的想象：祖先的摇篮是大森林，太阳会慢慢长大。这些想象让故事有了光彩。',
'想一想作者为什么这样想象：是为了让故事更美、更有力量，也让我们对世界多一些好奇。']},
{lessonId:'yw2b-unit3-imagine',title:'写话与想象：续编小故事', outline:['抓住故事线','合理想象','结尾点题'],pages:[
'续编故事先抓住「故事线」：主角是谁、想要什么、遇到了什么困难。新编的内容要顺着这条线走，不能另起炉灶。',
'想象要大胆也要合理：主角可以用新的办法解决问题，但不能突然多出与开头无关的人物或法宝。',
'好结尾会让故事「落地」：困难解决了没有？主角明白了什么？用一两句话点一点题，故事就完整了。']}]};
export const yw2bLessonPacks:Record<string,YwLessonPack>={
  'yw2b-unit1-findinfo':{ restatementPrompt:'请复述：从短文里找答案，分哪三步？', objective:'会带着问题读短文，能回原文定位并圈出答案依据', steps:[
    {title:'读清问题',body:'先读问题再读短文：知道找什么，眼睛才会搜索。问时间盯时间词，问谁盯人名。',action:'读问题，说出要找的关键信息。',visualCue:'问题里的关键词画圈。'},
    {title:'回原文定位',body:'找到相关句子完整读一遍，答案的依据就在原文里。',action:'指出答案出自短文哪一句。',visualCue:'原文句子画横线。'},
    {title:'圈出依据作答',body:'圈出能回答问题的词，用「因为……所以……」把依据说出来。',action:'圈答案依据并完整作答。',visualCue:'依据词加三角标记。'}],
    chapter:'阅读理解', entry:'先读问题，再回原文定位，答案要有原文依据。', avoid:'别读完问题就凭印象作答，答案必须回原文核对。', cue:'带着问题读短文，答案原文里找。', factNodes:[{id:'yw2b-question-first',label:'先读问题'},{id:'yw2b-locate',label:'回原文定位'}] },
  'yw2b-unit2-guess-words':{ restatementPrompt:'请复述：遇到不认识的词，用什么办法猜意思？', objective:'会联系上下文猜词义，并代回原文验证', steps:[
    {title:'读前后句',body:'词语的前后句常常在解释它。别急着查字典，先读上下文。',action:'读出新词前后两句话。',visualCue:'新词前后句标注序号。'},
    {title:'找线索',body:'找近义词、「就是说」类解释信号、或可以推想的例子。',action:'说出你找到的线索是哪一种。',visualCue:'线索词打勾。'},
    {title:'代回验证',body:'把猜出的意思代回句子里读一遍：通顺合理就猜对了。',action:'把意思代回去读并判断通不通顺。',visualCue:'通顺打对勾。'}],
    chapter:'词语理解', entry:'先读前后句找线索，猜出意思代回原文验证。', avoid:'别硬猜：上下文没有线索就标记出来问大人。', cue:'新词不查先猜猜，上下文里找线索。', factNodes:[{id:'yw2b-context',label:'上下文线索'},{id:'yw2b-verify',label:'代回验证'}] },
  'yw2b-unit3-imagine':{ restatementPrompt:'请复述：续编故事要抓住什么？什么样的结尾算好结尾？', objective:'能沿故事线合理想象续编，并用点题的句子收尾', steps:[
    {title:'抓故事线',body:'先理清主角是谁、想要什么、遇到什么困难。新内容要顺着这条线。',action:'说出主角的目标和困难。',visualCue:'故事线画成一条箭头。'},
    {title:'合理想象',body:'可以想新办法，但不能突然冒出与开头无关的人物或法宝。',action:'检查你的新情节和开头有没有关系。',visualCue:'无关情节划掉。'},
    {title:'结尾点题',body:'用一两句话交代困难解决了吗、主角明白了什么。',action:'给你的故事说一个点题的结尾。',visualCue:'结尾句加方框。'}],
    chapter:'写话与想象', entry:'抓故事线再想象，结尾点题一两句。', avoid:'想象别跑偏：与开头无关的情节再有趣也不加。', cue:'续故事：顺线想象，结尾点题。', factNodes:[{id:'yw2b-storyline',label:'故事线'},{id:'yw2b-ending',label:'结尾点题'}] },
  'yw2b-unit2-care':{ restatementPrompt:'请复述：读关爱故事，从哪里能体会到情感？', objective:'能读懂关爱故事，从细节中体会情感，联系自己的生活', steps:[
    {title:'读事情',body:'先读清发生了什么事：谁帮助了谁，为什么帮。事情读懂了，情感才有落脚点。',action:'说出故事里的主要事情。',visualCue:'事情画成一条线。'},
    {title:'找细节',body:'情感藏在细节里：一个动作、一句话、一个眼神。找到这些细节，就读懂了人物的心。',action:'圈出一个让你感动的细节。',visualCue:'细节句加下划线。'},
    {title:'体会情感',body:'想想这件事让你感动在哪里，如果换成你会怎么做。',action:'说说你的感受。',visualCue:'感受写进心里。'}],
    chapter:'关爱故事', entry:'先读清事情，再找细节，最后体会情感。', avoid:'别只读情节不体会情感，细节里才有真心。', cue:'读关爱故事：事情—细节—情感，三步读。', factNodes:[{id:'yw2b-care-event',label:'读清事情'},{id:'yw2b-care-detail',label:'找细节'},{id:'yw2b-care-feeling',label:'体会情感'}] },
  'yw2b-unit3-culture':{ restatementPrompt:'请复述：学识字课，怎样把词语记得更牢？', objective:'能读准字音、理解词义，并联系传统文化理解词语', steps:[
    {title:'读准字音',body:'识字先读准音、认清形。神州、传统、端午，每个字都要读到位。',action:'读一遍词语，指出容易读错的字。',visualCue:'生字加拼音。'},
    {title:'理解词义',body:'理解词义可以联系生活：你过年做过什么？端午吃什么？把词语和自己的生活连起来。',action:'用一个词语说说你的生活经历。',visualCue:'词语和生活场景连线。'},
    {title:'联系文化',body:'很多词语背后是文化：算盘是祖先的发明，「贝」原来表示钱。学词语也是了解文化。',action:'说一个你知道的传统文化小知识。',visualCue:'文化知识写在小书签上。'}],
    chapter:'识字与传统文化', entry:'先读准字音，再理解词义，最后联系文化。', avoid:'别只记字形不理解意思，词语要和生活连起来。', cue:'识字三步：读准、理解、连文化。', factNodes:[{id:'yw2b-culture-read',label:'读准字音'},{id:'yw2b-culture-mean',label:'理解词义'},{id:'yw2b-culture-link',label:'联系文化'}] },
  'yw2b-unit4-childhood':{ restatementPrompt:'请复述：读童年生活的文章，要读出什么？', objective:'能读出童真童趣，找出文中的想象，说出自己的感受', steps:[
    {title:'读趣事',body:'写童年的文章都很有趣：彩色的梦、沙滩上的童话。读的时候要读出那份天真和快乐。',action:'说说文中哪件事最有趣。',visualCue:'趣事用笑脸标出。'},
    {title:'找想象',body:'童趣常常来自想象：把梦涂成彩色，把沙堡当成真的国家。找出这些想象。',action:'指出一句你觉得最有童心的想象。',visualCue:'想象句加星号。'},
    {title:'说感受',body:'读完后说说：哪件事让你想起自己的童年？把自己的感受说出来。',action:'讲一件你自己的童年趣事。',visualCue:'感受写进对话框。'}],
    chapter:'童年生活', entry:'先读趣事，再找想象，最后说自己的感受。', avoid:'别把童趣当幼稚，那是可贵的想象力。', cue:'读童年：找趣事、找想象、说感受。', factNodes:[{id:'yw2b-child-fun',label:'读趣事'},{id:'yw2b-child-imagine',label:'找想象'},{id:'yw2b-child-feel',label:'说感受'}] },
  'yw2b-unit5-lesson':{ restatementPrompt:'请复述：读寓言，怎样从故事里悟出道理？', objective:'能读懂寓言，分析人物错在哪，说出故事的道理', steps:[
    {title:'读故事',body:'先读清故事里的人做了什么。亡羊补牢的人羊丢了才修圈，揠苗助长的人把禾苗拔高。',action:'说出故事里的人做了什么。',visualCue:'人物和动作连线。'},
    {title:'想错在哪',body:'想清楚错误的后果：羊又丢了，禾苗枯死了。从后果往回推，就明白错在哪。',action:'说出故事的后果和原因。',visualCue:'原因和结果用箭头连。'},
    {title:'说道理',body:'道理要能用在生活里：犯错及时改正，做事不能违背规律。用自己的话说出来。',action:'用一句话说出故事的道理。',visualCue:'道理放进对话框。'}],
    chapter:'寓言与道理', entry:'先读故事，再想错在哪，最后说出道理。', avoid:'道理别照抄，要能联系自己的生活。', cue:'读寓言：看做法、想后果、说道理。', factNodes:[{id:'yw2b-lesson-story',label:'读故事'},{id:'yw2b-lesson-wrong',label:'想错在哪'},{id:'yw2b-lesson-moral',label:'说道理'}] },
  'yw2b-unit6-nature':{ restatementPrompt:'请复述：读科普文章，怎样找出科学道理？', objective:'能读懂科普文章的现象与道理，说出依据', steps:[
    {title:'读懂现象',body:'科普文章先写现象：雷雨前为什么闷？大树为什么能指方向？先读清现象是什么。',action:'说出文章写的现象。',visualCue:'现象句加方框。'},
    {title:'找出道理',body:'再找「为什么会这样」：答案常常就在文章里，找出来读一读。',action:'找出文中解释原因的句子。',visualCue:'原因句加波浪线。'},
    {title:'说出依据',body:'回答时要说出依据：不是「我觉得」，而是「文章里说」。有证据才算读懂。',action:'用「文章里说……」说一条依据。',visualCue:'依据句加引号。'}],
    chapter:'自然与科学', entry:'先读懂现象，再找出道理，最后说出依据。', avoid:'别凭印象作答，答案要有文章依据。', cue:'读科普：现象—道理—依据，三步走。', factNodes:[{id:'yw2b-nature-phenomenon',label:'读懂现象'},{id:'yw2b-nature-reason',label:'找出道理'},{id:'yw2b-nature-evidence',label:'说出依据'}] },
  'yw2b-unit7-change':{ restatementPrompt:'请复述：读「改变」的故事，要弄清哪两件事？', objective:'能读懂成长变化的故事，分析变化原因，说出启示', steps:[
    {title:'读变化',body:'这类故事都在写变化：大象把耳朵竖起来又放下，小毛虫变成蝴蝶。先读清变了什么。',action:'说出故事里发生的变化。',visualCue:'变化前后画对比图。'},
    {title:'想原因',body:'想清楚为什么会变：大象听了别人的话，小毛虫努力长大。变化背后都有原因。',action:'说出变化的原因。',visualCue:'原因用箭头指向变化。'},
    {title:'说启示',body:'从变化里想启示：适合别人的不一定适合自己；坚持做对的事，慢慢就会变好。',action:'说说这个故事给你的启示。',visualCue:'启示写在小灯泡旁。'}],
    chapter:'改变与成长', entry:'先读变化，再想原因，最后说启示。', avoid:'别只看结果，变化的原因和启示更重要。', cue:'读改变：变了什么、为什么变、学到什么。', factNodes:[{id:'yw2b-change-what',label:'读变化'},{id:'yw2b-change-why',label:'想原因'},{id:'yw2b-change-lesson',label:'说启示'}] },
  'yw2b-unit8-myth':{ restatementPrompt:'请复述：读神话故事，要感受什么？', objective:'能感受神话的奇特想象，找出想象并体会其妙处', steps:[
    {title:'读神奇',body:'神话充满神奇的想象：羿射下九个太阳，世界年纪还小的时候万物会说话。读的时候感受那份神奇。',action:'说出你觉得最神奇的地方。',visualCue:'神奇处加星号。'},
    {title:'找想象',body:'找出文中不真实却让人觉得美的想象：祖先的摇篮是大森林，太阳会慢慢长大。',action:'指出一句最美的想象。',visualCue:'想象句加星号。'},
    {title:'想妙处',body:'想一想作者为什么这样想象：为了让故事更美、更有力量，也让我们对世界多一些好奇。',action:'说说这个想象好在哪里。',visualCue:'妙处写在小灯泡旁。'}],
    chapter:'神话与想象', entry:'先读神奇，再找想象，最后想妙处。', avoid:'别把神话当历史，它是想象，要读出美。', cue:'读神话：感受神奇，找出想象，想想为什么。', factNodes:[{id:'yw2b-myth-magic',label:'读神奇'},{id:'yw2b-myth-imagine',label:'找想象'},{id:'yw2b-myth-effect',label:'想妙处'}] }};
export const yw2bQuizByLesson:Record<string,Quiz>={
  'yw2b-unit1-findinfo':{quizId:'yw2b-u1-quiz-01',questions:[
{questionId:'z1',type:'choice',prompt:'「回到原文定位」是什么意思？',options:['在原文里找到能回答问题的那句话','把原文抄一遍','只读第一段'],expectedAnswer:'在原文里找到能回答问题的那句话',rationale:'答案要有据可查，依据就在原文的那句话里。'},
{questionId:'z2',type:'fill',prompt:'说出依据的好帮手：「____要出门，所以带上了伞。」',expectedAnswer:'因为',rationale:'「因为……所以……」能把原因和结果说清楚。'},
{questionId:'z3',type:'steps',prompt:'带着问题读短文时，问题问「什么时候」，你应该盯什么词？说说你的找答案步骤。',expectedAnswer:'盯表示时间的词：先读问题，回原文找到相关句子，圈出时间词作答',rationale:'按问题类型锁定对应的词，再回原文定位，最后圈词作答。',
 keyPointLabels:['盯什么词','步骤'],
 keyPoints:[['时间','时候','时间词'],['先读问题','问题','回原文','定位']]}]},
  'yw2b-unit2-guess-words':{quizId:'yw2b-u2-quiz-01',questions:[
{questionId:'z1',type:'choice',prompt:'遇到不认识的词，第一步做什么？',options:['读它的前后句找线索','马上问家长','跳过不理'],expectedAnswer:'读它的前后句找线索',rationale:'上下文常常在解释新词，先猜再验证是好办法。'},
{questionId:'z2',type:'fill',prompt:'猜出词义后，把它____回句子里读一遍，通顺就说明猜对了。',expectedAnswer:'代',rationale:'代回验证是猜词义的最后一步。'},
{questionId:'z3',type:'steps',prompt:'句子里「他说话总是拐弯抹角」的「拐弯抹角」可能是什么意思？说说你用了什么线索。',expectedAnswer:'说话不直截了当、绕圈子；线索是上下文说他「总是」这样，说话方式让人不好懂',rationale:'联系上下文推测词义，并说清用的哪条线索。',
 keyPointLabels:['词义','线索'],
 keyPoints:[['绕','不直接','不直','弯','含蓄'],['上下文','前后句','线索','总是']]}]},
  'yw2b-unit3-imagine':{quizId:'yw2b-u3-quiz-01',questions:[
{questionId:'z1',type:'choice',prompt:'续编故事，新编的内容要顺着什么走？',options:['故事线：主角、目标、困难','随便编一个新主角','越离奇越好'],expectedAnswer:'故事线：主角、目标、困难',rationale:'续编要顺着原故事线，不能另起炉灶。'},
{questionId:'z2',type:'fill',prompt:'好结尾要让故事「落地」：说清困难解决了吗、主角明白了____。',expectedAnswer:'什么',rationale:'结尾点题：交代结果和明白的道理，故事才完整。'},
{questionId:'z3',type:'steps',prompt:'续编时可以怎么判断一个新情节该不该加进去？说出你的判断办法。',expectedAnswer:'看它和开头的故事线有没有关系，无关的情节不加',rationale:'合理想象的标准：与故事线相关，与开头呼应。',
 keyPointLabels:['判断标准'],
 keyPoints:[['故事线','开头','有关','关系','相关','呼应']]}]},
  'yw2b-unit2-care':{quizId:'yw2b-u2-care-quiz-01',questions:[
{questionId:'c1',type:'choice',prompt:'读关爱故事，情感藏在哪里？',options:['细节里：一个动作、一句话','封面和插图里','生字表里'],expectedAnswer:'细节里：一个动作、一句话',rationale:'情感藏在具体的细节中，找到细节就读懂了人物的心。'},
{questionId:'c2',type:'fill',prompt:'读关爱故事，先读清发生了什么事，再找细节，最后体会____。',expectedAnswer:'情感',rationale:'读事情—找细节—体会情感，是读关爱故事的三步。'},
{questionId:'c3',type:'steps',prompt:'如果故事里有人帮助了别人，你会从哪里看出他是真心想帮？说说你的判断依据。',expectedAnswer:'从他的动作和说的话里看，比如主动去做、耐心解释，而不是敷衍',rationale:'真心帮助体现在具体的动作和话语中，要结合细节判断。',
 keyPointLabels:['判断依据','说明'],
 keyPoints:[['动作','做','帮','说','话'],['真心','主动','耐心','不是敷衍']]}]},
  'yw2b-unit3-culture':{quizId:'yw2b-u3-culture-quiz-01',questions:[
{questionId:'c1',type:'choice',prompt:'学识字课，怎样把词语记得更牢？',options:['把词语和自己的生活连起来','只抄写不读','只读不写'],expectedAnswer:'把词语和自己的生活连起来',rationale:'联系生活理解词义，记得更牢。'},
{questionId:'c2',type:'fill',prompt:'「神州」指的是____。',expectedAnswer:'中国',rationale:'神州是中国的古称，是传统文化中的说法。'},
{questionId:'c3',type:'steps',prompt:'说一个你知道的传统节日，并说说这个节日人们会做什么。',expectedAnswer:'示例：端午节，人们会包粽子、赛龙舟，纪念屈原',rationale:'传统节日都有来历和习俗，联系生活说出来就记得牢。',
 keyPointLabels:['节日','习俗'],
 keyPoints:[['端午','中秋','春节','元宵','清明','重阳'],['粽子','龙舟','月饼','饺子','汤圆']]}]},
  'yw2b-unit4-childhood':{quizId:'yw2b-u4-child-quiz-01',questions:[
{questionId:'c1',type:'choice',prompt:'读童年生活的文章，要读出什么？',options:['天真和快乐','悲伤和难过','严肃和紧张'],expectedAnswer:'天真和快乐',rationale:'写童年的文章都在写童真童趣，要读出那份天真快乐。'},
{questionId:'c2',type:'fill',prompt:'童趣常常来自____：把梦涂成彩色，把沙堡当成真的国家。',expectedAnswer:'想象',rationale:'童趣来自大胆的想象，这是可贵的童心。'},
{questionId:'c3',type:'steps',prompt:'讲一件你自己的童年趣事，并说说它有趣在哪里。',expectedAnswer:'示例：我小时候以为月亮会跟着我走，很有趣，因为那是天真的想象',rationale:'童年趣事往往因为天真和想象而有趣，说出来就是和作者对话。',
 keyPointLabels:['趣事','有趣之处'],
 keyPoints:[['我','小时候','有一次','记得'],['有趣','好玩','天真','想象']]}]},
  'yw2b-unit5-lesson':{quizId:'yw2b-u5-lesson-quiz-01',questions:[
{questionId:'c1',type:'choice',prompt:'《揠苗助长》里，那个人错在哪里？',options:['把禾苗拔高，违背了生长规律','没有给禾苗浇水','没有及时收割'],expectedAnswer:'把禾苗拔高，违背了生长规律',rationale:'禾苗有自己的生长规律，拔高反而让它枯死，做事不能违背规律。'},
{questionId:'c2',type:'fill',prompt:'《亡羊补牢》告诉我们：犯了错要及时____。',expectedAnswer:'改正',rationale:'羊丢了才修羊圈还不算晚，及时改正就不算迟。'},
{questionId:'c3',type:'steps',prompt:'读寓言时，怎样从故事里悟出道理？说说你的方法。',expectedAnswer:'先看人物做了什么，再想后果和原因，最后总结出能用在生活里的道理',rationale:'看做法—想后果—推原因—说道理，是从故事悟道理的方法。',
 keyPointLabels:['方法步骤','道理总结'],
 keyPoints:[['做','后果','原因','想','看'],['道理','生活','总结']]}]},
  'yw2b-unit6-nature':{quizId:'yw2b-u6-nature-quiz-01',questions:[
{questionId:'c1',type:'choice',prompt:'读科普文章，回答问题时应该依据什么？',options:['文章里说的','我觉得应该是','猜一猜'],expectedAnswer:'文章里说的',rationale:'科普文要有依据，答案常常就在文章里。'},
{questionId:'c2',type:'fill',prompt:'读科普文，先读懂____，再找出为什么会这样。',expectedAnswer:'现象',rationale:'先读清现象是什么，再找背后的科学道理。'},
{questionId:'c3',type:'steps',prompt:'在野外迷了路，可以怎样辨别方向？说出一种方法，并说说依据。',expectedAnswer:'看太阳：早晨太阳从东方升起，傍晚落下西方；或看北极星，它在正北方',rationale:'用自然现象辨方向，依据是太阳东升西落、北极星在北方。',
 keyPointLabels:['方法','依据'],
 keyPoints:[['太阳','北极星','树','影子'],['东','西','北','升','落']]}]},
  'yw2b-unit7-change':{quizId:'yw2b-u7-change-quiz-01',questions:[
{questionId:'c1',type:'choice',prompt:'读「改变」的故事，要弄清哪两件事？',options:['变了什么、为什么变','谁写的、写在哪','有几个自然段'],expectedAnswer:'变了什么、为什么变',rationale:'读变化故事，要弄清变化本身和变化的原因。'},
{questionId:'c2',type:'fill',prompt:'《小毛虫》里，小毛虫最后变成了____。',expectedAnswer:'蝴蝶',rationale:'小毛虫努力长大，最后变成了美丽的蝴蝶。'},
{questionId:'c3',type:'steps',prompt:'《大象的耳朵》这个故事给了你什么启示？说说你的理解。',expectedAnswer:'适合别人的不一定适合自己，不要盲目听信别人的话',rationale:'大象把耳朵竖起来反而不舒服，最后还是放下了，说明要认识自己。',
 keyPointLabels:['启示','理由'],
 keyPoints:[['适合','自己','别','不要','盲目','听信'],['自己','道理','所以']]}]},
  'yw2b-unit8-myth':{quizId:'yw2b-u8-myth-quiz-01',questions:[
{questionId:'c1',type:'choice',prompt:'读神话故事，要重点感受什么？',options:['奇特的想象','真实的历史','精确的数字'],expectedAnswer:'奇特的想象',rationale:'神话的魅力在奇特的想象，要读出那份神奇和美。'},
{questionId:'c2',type:'fill',prompt:'《羿射九日》里，羿射下了____个太阳。',expectedAnswer:'9',rationale:'神话里天上有十个太阳，羿射下九个，留下一个。'},
{questionId:'c3',type:'steps',prompt:'神话里的想象很神奇，作者为什么要这样想象？说说你的理解。',expectedAnswer:'为了让故事更美、更有力量，也让我们对世界多一些好奇和敬畏',rationale:'神话的想象让故事更有光彩，也承载着古人对世界的理解。',
 keyPointLabels:['作用','感受'],
 keyPoints:[['美','力量','神奇','好奇','想象'],['世界','故事','所以']]}]}};
export const yw2bLessonIdByQuiz:Record<string,string>=Object.fromEntries(Object.entries(yw2bQuizByLesson).map(([lessonId,quiz])=>[quiz.quizId,lessonId]));

/* ========== 数学二年级下册（苏教版对齐）==========
   单元框架对齐苏教版二下公开教学单元；正文与题目为本项目原创编写。 */
export const sjGrade2bTextbook:Textbook={ textbookId:'sj-math-2b-original', title:'数学小侦探·二年级下（苏教版对齐）', grade:'二年级', subject:'数学', edition:'原创对齐版 1.0', origin:'original-demo', rightsStatus:'authorized-demo', attribution:{sourceName:'对齐苏教版二年级下册教学单元 · 内容为原创示例',licenseNote:'单元结构对齐公开教学大纲；正文与题目为原创编写，不含出版社图文',version:'1.0.0'}, lessons:[
{lessonId:'sj2b-unit1-remainder',title:'有余数的除法：分不完怎么办', outline:['认识余数','除法竖式','余数必须比除数小'],pages:[
'13 颗糖平均分给 4 个小朋友，每人 3 颗，还剩 1 颗。剩下的 1 颗不够再分一份，就叫「余数」。写成算式：13÷4=3……1。',
'有余数的除法也能写竖式：先写被除数，再写除数，商写在上面，然后算商乘除数，用被除数减掉它，得到余数。',
'有一条铁律：余数一定要比除数小。如果余数比除数大，说明还能再分一次，商就写小了。算完记得检查一遍。']},
{lessonId:'sj2b-unit2-time',title:'时、分、秒：会看钟表', outline:['认识钟面','读几时几分','1时=60分，1分=60秒'],pages:[
'钟面上有三根针：最短的是时针，较长的是分针，最细的是秒针。时针走 1 大格是 1 小时，分针走 1 小格是 1 分。',
'读时间先看时针：时针过了几，就是几时；再看分针从 12 起走了几小格，就是几分。时针在 3 和 4 之间、分针指 6，就是 3 时 30 分。',
'时、分、秒之间的关系：1 时=60 分，1 分=60 秒。分针走一圈是 60 分即 1 小时；秒针走一圈是 60 秒即 1 分。']},
{lessonId:'sj2b-unit3-direction',title:'认识方向：东南西北与平面图', outline:['认东南西北','平面图上的方向','东南、西南、东北、西北'],pages:[
'太阳从东方升起。面向东，后面是西，左面是北，右面是南。记住「东对西、南对北」。',
'看地图有口诀：上北下南，左西右东。看图先找方向标，再判断位置。',
'除了四个正方向，还有四个斜方向：东和北之间是东北，东和南之间是东南，西和北之间是西北，西和南之间是西南。']},
{lessonId:'sj2b-unit3-recognize-numbers',title:'认识万以内的数：数位与组成', outline:['认识新的计数单位','数位顺序表','读写万以内的数'],pages:[
'数数时，一个一个地数，10 个一是十；十个十个地数，10 个十是一百；一百一百地数，10 个一百是一千。千位是我们认识的新数位。',
'数位顺序表要记牢：从右边起，第一位是个位、第二位是十位、第三位是百位、第四位是千位。同一个数字站在不同数位上，表示的大小完全不同。',
'读数从高位读起：3056 读作「三千零五十六」，中间的 0 要读出来；末尾的 0 不读，比如 5600 读作「五千六百」。写数时哪一位上一个也没有，就写 0 占位。']},
{lessonId:'sj2b-unit5-dm-mm',title:'分米和毫米：更细的长度单位', outline:['认识分米','认识毫米','单位换算'],pages:[
'量课桌的长，用厘米太小、用米太大，这时用「分米」正合适。1 分米 = 10 厘米。',
'量硬币的厚度、铅笔尖的粗细，要用更小的「毫米」。1 厘米 = 10 毫米，尺子上最小的刻度就是 1 毫米。',
'单位换算是这样的：1 米 = 10 分米 = 100 厘米 = 1000 毫米。大单位换小单位乘进率：2 分米 = 20 厘米，30 毫米 = 3 厘米。']},
{lessonId:'sj2b-unit6-addsub',title:'两、三位数的加法和减法', outline:['两位数口算','三位数进位加法','三位数退位减法'],pages:[
'两位数加减可以口算，用凑整最方便：38+45，先算 38+40=78，再算 78+5=83。',
'三位数加法要数位对齐，从个位加起，哪一位满十就向前一位进 1。连续进位时，每一步都别忘加进上来的 1。',
'三位数减法从个位减起，不够减向前一位借 1 当 10。如果中间那位是 0，隔位退位时要先把它变成 9 再减。']},
{lessonId:'sj2b-unit7-angle',title:'角的初步认识：直角、锐角和钝角', outline:['角的组成','角的大小','直角、锐角、钝角'],pages:[
'角由一个顶点和两条边组成。两条边都是直的，从顶点出发向两边张开。',
'角的大小和两条边张开的程度有关，和边的长短没有关系。张得越开，角就越大。',
'用三角尺上的直角去比一比：和直角一样大的是直角；比直角小的是锐角；比直角大的是钝角。']},
{lessonId:'sj2b-unit8-data',title:'数据的收集和整理（一）', outline:['按不同标准分类','收集数据的方法','整理成表格'],pages:[
'同样一组东西可以按不同标准分类：同学可以按性别分，也可以按戴不戴眼镜分。标准不同，分出的结果也不同。',
'收集数据可以用举手、打勾，也可以用画「正」字的方法——一个「正」字正好 5 笔，数起来很方便。',
'把收集到的数据整理成表格或条形图，一眼就能看出哪类最多、哪类最少。']},
{lessonId:'sj2b-unit9-review',title:'期末复习：数、量、方向与图形', outline:['数与计算查漏','单位与方向查漏','图形与时间查漏'],pages:[
'有余数除法先求商、再看余数，余数必须比除数小；两三位数加减从个位起，满十进 1、不够借 10。',
'单位从小到大排：毫米 < 厘米 < 分米 < 米，相邻两个单位的进率都是 10。方向记住「上北下南、左西右东」。',
'角按大小分直角、锐角、钝角；读时间先看时针过了几，再数分针小格。复习先找自己最常错的模块，再针对性练。']}]};
export const sj2bLessonPacks:Record<string,SjLessonPack>={
  'sj2b-unit3-recognize-numbers':{ restatementPrompt:'请复述：数位顺序表从右边起依次是哪些数位？3056 中间的 0 读不读？', objective:'认识千位与数位顺序，正确读写万以内的数', steps:[
    {title:'认识千位',body:'10 个一百是一千。千位在数位顺序表右边第四位。',action:'说出数位顺序表从右起前四位。',visualCue:'画数位顺序表填四位。'},
    {title:'数位决定大小',body:'同一个数字站不同数位大小完全不同：5555 里四个 5 从千位到个位依次是五千、五百、五十、五。',action:'说出一个数里每个数字表示多少。',visualCue:'给每个数字标注数位。'},
    {title:'读写有 0 的数',body:'读数从高位起：中间的 0 要读（3056 读三千零五十六），末尾的 0 不读（5600 读五千六百）；写数时 0 要占位。',action:'读出一个中间带 0 和一个末尾带 0 的数。',visualCue:'0 的位置用彩笔标出。'}],
    chapter:'万以内数的认识', entry:'先看是几位数、最高位是什么位，再从高位读起。', avoid:'写数时中间和末尾的 0 别丢，读数时末尾的 0 别多读。', cue:'读数写数先定数位，从高位起一位一位来。', factNodes:[{id:'sj2b-thousand',label:'千位与数位顺序'},{id:'sj2b-zero-read',label:'0 的读法'}] },
  /* 一 有余数的除法 */
  'sj2b-unit1-remainder':{ restatementPrompt:'请复述：13÷4=3……1 里，3 和 1 各表示什么？余数能比除数大吗？', objective:'理解有余数除法的含义，会写除法竖式，知道余数一定比除数小', steps:[
    {title:'分不完怎么办',body:'13 颗糖平均分给 4 人，每人 3 颗还剩 1 颗。剩下的 1 颗不够再分一份，就叫余数。',action:'说说剩下的为什么不能再分。',visualCue:'剩下的 1 颗单独圈出来。'},
    {title:'认识除法竖式',body:'除法竖式先写被除数，再写除数，商写在上面，最后算商乘除数的积，用被除数减掉它得到余数。',action:'照着写一个除法竖式，指出商和余数。',visualCue:'竖式各部分用箭头标注名称。'},
    {title:'余数必须比除数小',body:'余数如果比除数大，说明还能再分一次，商就小了。检查口诀：余数 < 除数。',action:'检查一个算式，判断余数对不对。',visualCue:'余数和除数比大小。'}],
    chapter:'有余数的除法', entry:'先想口诀求商，分不完剩下的就是余数，余数必须比除数小。', avoid:'余数别忘写，也别把余数写得比除数还大。', cue:'除不尽写余数，余数永远比除数小。', factNodes:[{id:'sj2b-remainder-mean',label:'有余数除法的含义'},{id:'sj2b-remainder-form',label:'除法竖式'},{id:'sj2b-remainder-rule',label:'余数小于除数'}] },
  /* 二 时、分、秒 */
  'sj2b-unit2-time':{ restatementPrompt:'请复述：1 时等于多少分？1 分等于多少秒？', objective:'认识时、分、秒，会看钟表读时间，知道 1 时=60 分、1 分=60 秒', steps:[
    {title:'认识钟面',body:'钟面上有时针（短）、分针（长）和秒针（最细）。时针走 1 大格是 1 小时，分针走 1 小格是 1 分。',action:'指出钟面上的时针和分针各指向几。',visualCue:'三根指针用不同颜色标出。'},
    {title:'读几时几分',body:'先看时针过了几，就是几时；再看分针从 12 起走了几小格，就是几分。时针指 3 和 4 之间，分针指 6，就是 3 时 30 分。',action:'读出一个钟面显示的时间。',visualCue:'先定时针，再数分针小格。'},
    {title:'时分秒的关系',body:'1 时=60 分，1 分=60 秒。分针走一圈是 60 分即 1 小时；秒针走一圈是 60 秒即 1 分。',action:'说出 2 时等于多少分、3 分等于多少秒。',visualCue:'60 分=1 时，60 秒=1 分。'}],
    chapter:'时、分、秒', entry:'先看时针定几时，再数分针小格定几分。', avoid:'别把时针和分针看反；分针不是指几就是几分，要数小格。', cue:'读时间先看时针过几，再数分针小格。', factNodes:[{id:'sj2b-time-clock',label:'认识钟面'},{id:'sj2b-time-read',label:'读几时几分'},{id:'sj2b-time-relation',label:'1时=60分，1分=60秒'}] },
  /* 三 认识方向 */
  'sj2b-unit3-direction':{ restatementPrompt:'请复述：地图上怎么确定方向？东南、西南各在哪边？', objective:'认识东、南、西、北和东南、西南、东北、西北，会看平面图定方向', steps:[
    {title:'认东南西北',body:'太阳从东方升起。面向东，后面是西，左面是北，右面是南。记住「东对西、南对北」。',action:'说出面向东时，前、后、左、右各是什么方向。',visualCue:'十字箭头标出四个方向。'},
    {title:'看平面图',body:'平面图上的方向口诀：上北下南，左西右东。看图先找方向标，再定位置。',action:'在平面图上指出某个地点在另一个地点的哪个方向。',visualCue:'图上画方向标。'},
    {title:'认识四个斜方向',body:'东和北之间是东北，东和南之间是东南，西和北之间是西北，西和南之间是西南。',action:'说出学校在家的东北方，那家在学校的哪个方向。',visualCue:'四个斜方向标在十字之间。'}],
    chapter:'认识方向', entry:'先认东南西北，再看图上方向标，最后判断相对位置。', avoid:'别只凭感觉指方向，先找参照物和方向标。', cue:'上北下南左西右东，先找方向标再定位置。', factNodes:[{id:'sj2b-dir-four',label:'东南西北四方向'},{id:'sj2b-dir-map',label:'平面图上的方向'},{id:'sj2b-dir-diagonal',label:'东南、西南、东北、西北'}] },
  /* 五 分米和毫米 */
  'sj2b-unit5-dm-mm':{ restatementPrompt:'请复述：1 分米等于多少厘米？1 厘米等于多少毫米？', objective:'认识分米和毫米，掌握米、分米、厘米、毫米之间的换算', steps:[
    {title:'认识分米',body:'1 分米 = 10 厘米。分米比厘米大、比米小。用尺子量，10 厘米长的一段就是 1 分米。',action:'用尺子指出 1 分米有多长。',visualCue:'10 厘米标成 1 分米。'},
    {title:'认识毫米',body:'1 厘米 = 10 毫米。毫米很小，量硬币厚度、铅笔尖用它。尺子上最小的刻度就是 1 毫米。',action:'数出 1 厘米里有几个小格。',visualCue:'1 厘米放大显示 10 个小格。'},
    {title:'单位换算',body:'大单位换小单位乘进率：1 米=10 分米=100 厘米=1000 毫米。2 分米 = 20 厘米，30 毫米 = 3 厘米。',action:'把 5 分米换成厘米、把 40 毫米换成厘米。',visualCue:'单位阶梯：米—分米—厘米—毫米。'}],
    chapter:'分米和毫米', entry:'先看单位大小：米>分米>厘米>毫米，相邻两级进率是 10。', avoid:'换算时别把进率记错；写单位别漏。', cue:'分米厘米毫米相邻进率都是 10。', factNodes:[{id:'sj2b-dm',label:'1分米=10厘米'},{id:'sj2b-mm',label:'1厘米=10毫米'},{id:'sj2b-convert',label:'单位换算'}] },
  /* 六 两、三位数的加法和减法 */
  'sj2b-unit6-addsub':{ restatementPrompt:'请复述：三位数加法连续进位时要注意什么？退位减法呢？', objective:'会口算两位数加减，会笔算三位数进位加法和退位减法，能解决两步计算问题', steps:[
    {title:'口算两位数加减',body:'口算可以凑整：38+45，先算 38+40=78，再算 78+5=83。减法同理，先减整十再减个位。',action:'用凑整法口算一道两位数加法。',visualCue:'拆成整十和个位两段。'},
    {title:'笔算进位加法',body:'三位数加法数位对齐，从个位加起。哪一位满十就向前一位进 1。连续进位时每一步都要记得加进上来的 1。',action:'笔算 356+287，说出哪几位进了 1。',visualCue:'进位小 1 标在前一位下面。'},
    {title:'笔算退位减法',body:'三位数减法从个位减起，不够减向前一位借 1 当 10。隔位退位时，中间那位要变成 9。',action:'笔算 502-178，说明退位过程。',visualCue:'退位点标记在被借的数位上。'}],
    chapter:'两、三位数的加法和减法', entry:'先看数位是否对齐，再从个位算起，满十进 1、不够借 10。', avoid:'连续进位别漏加进上来的 1；隔位退位别忘中间位变 9。', cue:'三位数加减从个位起，满十进 1、不够借 10。', factNodes:[{id:'sj2b-addsub-oral',label:'两位数口算'},{id:'sj2b-addsub-carry',label:'三位数进位加法'},{id:'sj2b-addsub-borrow',label:'三位数退位减法'}] },
  /* 七 角的初步认识 */
  'sj2b-unit7-angle':{ restatementPrompt:'请复述：角由什么组成？怎样判断直角、锐角和钝角？', objective:'认识角，会比较角的大小，会区分直角、锐角和钝角', steps:[
    {title:'认识角',body:'角由一个顶点和两条边组成。角的两条边是直的，从顶点出发。',action:'指着一个角，说出顶点和两条边在哪。',visualCue:'顶点画点，两条边加粗。'},
    {title:'角的大小',body:'角的大小和两条边张开的程度有关，和边的长短无关。张得越开，角越大。',action:'比较两个角，说出哪个大、为什么。',visualCue:'把两个角叠在一起比。'},
    {title:'认识直角、锐角、钝角',body:'用三角尺上的直角去比：和直角一样的是直角；比直角小的是锐角；比直角大的是钝角。',action:'用三角尺比一比，判断三个角各是什么角。',visualCue:'直角标小方框，锐角钝角分别标注。'}],
    chapter:'角的初步认识', entry:'先认顶点和两条边，再用三角尺的直角去比，判断是什么角。', avoid:'角的大小看张开程度，别被边的长短骗了。', cue:'比直角：一样是直角，小了是锐角，大了是钝角。', factNodes:[{id:'sj2b-angle-part',label:'角的组成'},{id:'sj2b-angle-size',label:'角的大小'},{id:'sj2b-angle-kind',label:'直角、锐角、钝角'}] },
  /* 八 数据的收集和整理（一） */
  'sj2b-unit8-data':{ restatementPrompt:'请复述：收集数据时怎样分类？整理后怎样看得更清楚？', objective:'会按不同标准分类，会用简单方法收集和整理数据', steps:[
    {title:'按标准分类',body:'同样的东西可以按不同标准分类：同学可以按性别分，也可以按戴不戴眼镜分。标准不同，分出的结果不同。',action:'说出一种可以给班里同学分类的标准。',visualCue:'同一堆物体用两种标准各分一次。'},
    {title:'收集数据',body:'收集数据可以用举手、打勾、画正字。画「正」字最方便：一个正字就是 5 个。',action:'用画正字的方法记录一组数据。',visualCue:'正字每笔代表 1，五笔成 1 组。'},
    {title:'整理并看结果',body:'把数据整理成表格或条形图，一眼就能看出哪类最多、哪类最少。',action:'看表格说出最多和最少的类别。',visualCue:'表格数字对应条形高度。'}],
    chapter:'数据的收集和整理（一）', entry:'先定分类标准，再收集数据，最后整理成表格看结果。', avoid:'分类标准要统一，中途别换标准。', cue:'分类—收集—整理，三步看清数据。', factNodes:[{id:'sj2b-data-classify',label:'按不同标准分类'},{id:'sj2b-data-collect',label:'数据的收集与整理'}] },
  /* 九 期末复习 */
  'sj2b-unit9-review':{ restatementPrompt:'请复述：这学期学的有余数除法、时分秒、方向和单位，哪块最容易错？', objective:'复习有余数除法、万以内数、两三位数加减法、时分秒、方向、单位与角，查漏补缺', steps:[
    {title:'数与计算查漏',body:'有余数除法先求商再看余数（余数必须比除数小）；两三位数加减从个位起，满十进 1、不够借 10。',action:'挑一道做错的除法或加减题重算并检查。',visualCue:'竖式对齐，进位退位标出来。'},
    {title:'量与方向查漏',body:'单位从小到大：毫米<厘米<分米<米，相邻进率 10；方向记住上北下南左西右东。',action:'换算两个单位，指出平面图上一个地点的方向。',visualCue:'单位阶梯图和方向十字图。'},
    {title:'图形与时间查漏',body:'角按大小分直角、锐角、钝角；时间读法先看时针再过几、再数分针小格，1 时=60 分。',action:'判断一个角是什么角，读出一个钟面时间。',visualCue:'三角尺比角，钟面标指针。'}],
    chapter:'期末复习', entry:'按模块自查：计算看进位退位和余数，量与方向看进率和方向标。', avoid:'复习别只刷题，先定位自己最常错的模块。', cue:'复习先找薄弱模块，再针对性练。', factNodes:[{id:'sj2b-review-calc',label:'数与计算复习'},{id:'sj2b-review-unit',label:'单位与方向复习'},{id:'sj2b-review-shape',label:'图形与时间复习'}] },
};export const sj2bQuizByLesson:Record<string,Quiz>={
  'sj2b-unit1-remainder':{quizId:'sj2b-remainder-quiz-01',questions:[
{questionId:'x1',type:'choice',prompt:'13÷4=3……1 里，「1」表示什么？',options:['余数（分完剩下的）','商','除数'],expectedAnswer:'余数（分完剩下的）',rationale:'13 颗糖分给 4 人，每人 3 颗，剩下 1 颗分不完，剩下的 1 就是余数。'},
{questionId:'x2',type:'fill',prompt:'17÷5=3……____。',expectedAnswer:'2',rationale:'5×3=15，17-15=2，所以余数是 2。'},
{questionId:'x3',type:'choice',prompt:'下面哪个算式的余数写错了？',options:['19÷4=4……3','23÷5=4……3','26÷6=4……4'],expectedAnswer:'26÷6=4……4',rationale:'26÷6=4……2，余数 4 比除数 6 小但 6×4=24、26-24=2；写成 4 是错的。余数必须小于除数且是减出来的差。'},
{questionId:'x4',type:'steps',prompt:'25 颗糖平均分给 4 人，每人几颗？还剩几颗？写出算式，并检查余数是否比除数小。',expectedAnswer:'25÷4=6……1，余数 1 比除数 4 小，正确',rationale:'4×6=24，25-24=1；余数 1<除数 4，检查通过。',
 keyPointLabels:['算式','余数检查'],
 keyPoints:[['25÷4','25除以4'],['1','一颗','剩一'],['小于','比4小','1<4','小']]}]},
  'sj2b-unit2-time':{quizId:'sj2b-time-quiz-01',questions:[
{questionId:'t1',type:'fill',prompt:'1 时 = ____ 分。',expectedAnswer:'60',rationale:'1 时=60 分，分针走一圈就是 60 分。'},
{questionId:'t2',type:'choice',prompt:'钟面上最短的那根针是什么针？',options:['时针','分针','秒针'],expectedAnswer:'时针',rationale:'时针最短，分针较长，秒针最细最长。'},
{questionId:'t3',type:'fill',prompt:'1 分 = ____ 秒。',expectedAnswer:'60',rationale:'1 分=60 秒，秒针走一圈就是 60 秒。'},
{questionId:'t4',type:'steps',prompt:'时针在 3 和 4 之间，分针指向 6，现在是什么时间？说说你怎么读出来的。',expectedAnswer:'3 时 30 分；时针过了 3 就是 3 时，分针从 12 走了 30 小格就是 30 分',rationale:'先看时针定位（过了 3 就是 3 时），再数分针小格定分（指 6 是 30 分）。',
 keyPointLabels:['时间','读法'],
 keyPoints:[['3时30分','3:30','三点三十','3 时 30 分'],['时针','分针','小格','过了3']]}]},
  'sj2b-unit3-direction':{quizId:'sj2b-direction-quiz-01',questions:[
{questionId:'e1',type:'choice',prompt:'早晨面向太阳，你的后面是哪个方向？',options:['西','东','北'],expectedAnswer:'西',rationale:'太阳从东方升起，面向东，后面就是西。'},
{questionId:'e2',type:'fill',prompt:'地图上的方向口诀：上北下南，左西右____。',expectedAnswer:'东',rationale:'看地图有口诀：上北下南，左西右东。'},
{questionId:'e3',type:'choice',prompt:'东和北之间的方向叫什么？',options:['东北','东南','西北'],expectedAnswer:'东北',rationale:'东和北之间是东北，东和南之间是东南。'},
{questionId:'e4',type:'steps',prompt:'学校在家的东北方向，那么家在学校的哪个方向？说说你是怎么判断的。',expectedAnswer:'家在学校的西南方向；因为方向是相对的，东北和西南相反',rationale:'相对方向互为相反：东北对西南，东南对西北。',
 keyPointLabels:['方向','判断依据'],
 keyPoints:[['西南'],['相对','相反','反过来']]}]},
  'sj2b-unit3-recognize-numbers':{quizId:'sj2b-numbers-quiz-01',questions:[
{questionId:'n1',type:'choice',prompt:'数位顺序表从右边起，第四位是什么位？',options:['千位','百位','万位'],expectedAnswer:'千位',rationale:'从右起依次是个位、十位、百位、千位，第四位是千位。'},
{questionId:'n2',type:'fill',prompt:'3056 读作三千____五十六。（填数位上的数字）',expectedAnswer:'零',rationale:'3056 读作「三千零五十六」，中间的 0 要读出来。'},
{questionId:'n3',type:'steps',prompt:'5600 读作什么？5600 里的两个 0 各表示什么？写出你的想法。',expectedAnswer:'5600 读作五千六百；末尾的 0 不读，表示十位和个位上一个也没有',rationale:'读数从高位起，末尾的 0 不读；0 占位表示该数位没有计数单位。',
 keyPointLabels:['读法','0 的含义'],
 keyPoints:[['五千六百','5600'],['末尾','不读','不用读'],['占位','没有','零个']]}]},
  'sj2b-unit5-dm-mm':{quizId:'sj2b-dmmm-quiz-01',questions:[
{questionId:'u1',type:'fill',prompt:'1 分米 = ____ 厘米。',expectedAnswer:'10',rationale:'1 分米=10 厘米，分米比厘米大。'},
{questionId:'u2',type:'fill',prompt:'1 厘米 = ____ 毫米。',expectedAnswer:'10',rationale:'1 厘米=10 毫米，尺子上 1 厘米里有 10 个小格。'},
{questionId:'u3',type:'choice',prompt:'量一枚硬币的厚度，用什么单位最合适？',options:['毫米','分米','米'],expectedAnswer:'毫米',rationale:'硬币很薄，用最小的长度单位毫米最合适。'},
{questionId:'u4',type:'steps',prompt:'3 分米等于多少厘米？50 毫米等于多少厘米？说说你是怎么换算的。',expectedAnswer:'3 分米=30 厘米，50 毫米=5 厘米；大单位换小单位乘进率 10，小单位换大单位除以进率 10',rationale:'相邻单位进率是 10：分米→厘米乘 10，毫米→厘米除以 10。',
 keyPointLabels:['换算结果','换算方法'],
 keyPoints:[['30'],['5'],['10','进率','乘','除']]}]},
  'sj2b-unit6-addsub':{quizId:'sj2b-addsub-quiz-01',questions:[
{questionId:'a1',type:'fill',prompt:'356+287=____（注意连续进位）。',expectedAnswer:'643',rationale:'个位 6+7=13 写 3 进 1；十位 5+8+1=14 写 4 进 1；百位 3+2+1=6，结果 643。'},
{questionId:'a2',type:'fill',prompt:'502-178=____（注意隔位退位）。',expectedAnswer:'324',rationale:'个位 2-8 不够，向十位借；十位是 0，再向百位借，十位变 9；12-8=4，9-7=2，4-1=3，结果 324。'},
{questionId:'a3',type:'choice',prompt:'笔算三位数加法时，哪一位满十要向前一位进 1？',options:['哪一位满十就向它的前一位进 1','只有个位要进位','只有百位要进位'],expectedAnswer:'哪一位满十就向它的前一位进 1',rationale:'加法从个位算起，任何一位相加满十都要向前一位进 1。'},
{questionId:'a4',type:'steps',prompt:'用凑整法口算 38+45，写出你的计算过程。',expectedAnswer:'先算 38+40=78，再算 78+5=83',rationale:'把 45 拆成 40 和 5，先加整十再加个位，口算又快又准。',
 keyPointLabels:['第一步','第二步','结果'],
 keyPoints:[['38+40','78'],['78+5','83'],['83']]}]},
  'sj2b-unit7-angle':{quizId:'sj2b-angle-quiz-01',questions:[
{questionId:'g1',type:'choice',prompt:'一个角由什么组成？',options:['一个顶点和两条边','三条边','两条平行线'],expectedAnswer:'一个顶点和两条边',rationale:'角由一个顶点和从顶点出发的两条边组成。'},
{questionId:'g2',type:'choice',prompt:'比直角小的角叫什么角？',options:['锐角','钝角','直角'],expectedAnswer:'锐角',rationale:'比直角小的是锐角，比直角大的是钝角。'},
{questionId:'g3',type:'fill',prompt:'用三角尺上的直角去比，和直角一样大的角是____角。',expectedAnswer:'直',rationale:'和直角一样大的是直角。'},
{questionId:'g4',type:'steps',prompt:'角的大小和边的长短有关系吗？说说你是怎么判断一个角是锐角还是钝角的。',expectedAnswer:'没关系，角的大小看两边张开的程度；用三角尺的直角去比，比直角小是锐角，比直角大是钝角',rationale:'角的大小取决于张口大小，与边长无关；判断靠三角尺的直角比对。',
 keyPointLabels:['有无关系','判断方法'],
 keyPoints:[['没','无','不'],['三角尺','直角','比','张开']]}]},
  'sj2b-unit8-data':{quizId:'sj2b-data-quiz-01',questions:[
{questionId:'p1',type:'choice',prompt:'给班里的同学分类，下面哪个标准可以用？',options:['按性别分','按身高是否超过 1 米 3 分','以上都可以'],expectedAnswer:'以上都可以',rationale:'同一组数据可以按不同标准分类，标准不同结果不同。'},
{questionId:'p2',type:'fill',prompt:'用画「正」字的方法记录数据，一个「正」字表示 ____ 个。',expectedAnswer:'5',rationale:'「正」字正好 5 笔，一笔代表 1 个，一个正字就是 5 个。'},
{questionId:'p3',type:'steps',prompt:'要统计班里同学最喜欢的水果，你会怎么做？说出你的收集和整理步骤。',expectedAnswer:'先定标准（按水果种类分），再用举手或画正字收集，最后整理成表格看哪类最多',rationale:'分类—收集—整理三步：定标准、记录数据、整理成表格。',
 keyPointLabels:['收集方法','整理方法'],
 keyPoints:[['举手','正字','打勾','问'],['表格','整理','数']]}]},
  'sj2b-unit9-review':{quizId:'sj2b-review-quiz-01',questions:[
{questionId:'q1',type:'fill',prompt:'1 米 = ____ 分米。',expectedAnswer:'10',rationale:'1 米=10 分米=100 厘米=1000 毫米。'},
{questionId:'q2',type:'choice',prompt:'下面哪个说法是对的？',options:['余数必须比除数小','余数可以等于除数','余数越大越好'],expectedAnswer:'余数必须比除数小',rationale:'余数如果大于或等于除数，说明还能再分一次。'},
{questionId:'q3',type:'steps',prompt:'算 402-157，写出你的计算过程和结果（注意隔位退位）。',expectedAnswer:'402-157=245；个位 2-7 不够，十位是 0 要向百位借，十位变 9，12-7=5，9-5=4，3-1=2，结果 245',rationale:'隔位退位：十位为 0 时先向百位借 1，十位变 9 再继续减。',
 keyPointLabels:['结果','退位过程'],
 keyPoints:[['245'],['退位','借','9','0']]}]}};
export const sj2bLessonIdByQuiz:Record<string,string>=Object.fromEntries(Object.entries(sj2bQuizByLesson).map(([lessonId,quiz])=>[quiz.quizId,lessonId]));
/* 平行四边形初步认识·原创测验（对齐「认图形、找平行、拼图形」认知目标，不涉及计算）
   步骤/填空题按踩点给分：keyPoints 每组为可接受的同义表达，全覆盖才判对（孩子不必逐字复述标准答案） */
export const sjGeometryQuiz:Quiz={ quizId:'sj2a-geo-quiz-01', questions:[
{questionId:'g1',type:'choice',prompt:'下面的图形，哪一个不是四边形？',options:['三角形','长方形','平行四边形'],expectedAnswer:'三角形',rationale:'四边形都有 4 条边和 4 个角；三角形只有 3 条边。'},
{questionId:'g2',type:'fill',prompt:'长方形和平行四边形的相同点是都有 ____ 条边、____ 个角。（用一个数字填空，如 4）',expectedAnswer:'4',rationale:'它们都是四边形：4 条边、4 个角。'},
{questionId:'g3',type:'steps',prompt:'怎样把长方形拉成平行四边形？说说发生了什么变化、什么没变。',expectedAnswer:'拉动两个对角，边的长度没变，角的大小变了（不再都是直角）',rationale:'长方形被拉动后四条边长度不变，但角度改变，就变成了平行四边形。',
 keyPointLabels:['拉动动作','边长不变','角度改变'],
 keyPoints:[['拉','推','压','拉动','拉对角','推对角','拉两个对角','拉住两个角'],['边','长度','边长'],['角']]} ,
{questionId:'g4',type:'choice',prompt:'平行四边形和长方形最大的不同是什么？',options:['角的度数不同','边的条数不同','都不是四边形'],expectedAnswer:'角的度数不同',rationale:'平行四边形对边平行且相等，但角不必是直角；长方形四个角都是直角。'} ]};

/* 厘米和米·原创测验（对齐「认刻度、用厘米量、米厘米换算、选单位」认知目标）
   步骤题踩点给分：说出「对准 0」「看另一端刻度」两个要点全覆盖才判对 */
export const sjLengthQuiz:Quiz={ quizId:'sj2a-length-quiz-01', questions:[
{questionId:'l1',type:'choice',prompt:'量一支铅笔的长度，应该用什么单位？',options:['厘米','米','时'],expectedAnswer:'厘米',rationale:'铅笔比较短，用厘米作单位；米用来量黑板、教室这些长的东西。'},
{questionId:'l2',type:'fill',prompt:'1 米 = ____ 厘米。',expectedAnswer:'100',rationale:'米和厘米是好朋友：1 米=100 厘米。'},
{questionId:'l3',type:'choice',prompt:'下面哪个说法一听就不合理？',options:['黑板长约 4 米','铅笔长约 18 厘米','课桌高约 70 米'],expectedAnswer:'课桌高约 70 米',rationale:'课桌大约 70 厘米高，70 米相当于 20 层楼，单位选错了。'},
{questionId:'l4',type:'steps',prompt:'用刻度尺量一条线段，应该怎样量？说出测量的步骤。',expectedAnswer:'把线段的一端对准刻度 0，尺子放平，再看线段另一端对着几，就是几厘米',rationale:'对准 0 刻度、放平尺子、读另一端刻度，是测量的三个关键动作。',
 keyPointLabels:['对准 0','放平','读另一端'],
 keyPoints:[['0','零','刻度0','一端'],['平','放平','贴','对齐'],['另一端','读','看','刻度']]} ]};

/* 表内除法（一）·原创测验（对齐「平均分、除法算式、口诀求商」认知目标） */
export const sjDivisionQuiz:Quiz={ quizId:'sj2a-division-quiz-01', questions:[
{questionId:'v1',type:'choice',prompt:'下面哪种分法是平均分？',options:['把 8 块糖分给 2 人，每人 4 块','把 8 块糖分给 2 人，一人 5 块一人 3 块','把 8 块糖全给一个人'],expectedAnswer:'把 8 块糖分给 2 人，每人 4 块',rationale:'每份分得同样多才叫平均分。5 块和 3 块不一样多，不是平均分。'},
{questionId:'v2',type:'fill',prompt:'12÷3=____（想口诀：三四十二）。',expectedAnswer:'4',rationale:'12÷3 想「三四十二」，商是 4，即每份 4 个。'},
{questionId:'v3',type:'choice',prompt:'8÷2=4 这个算式里，「2」表示什么？',options:['平均分成的份数','要分的总数','每份的个数'],expectedAnswer:'平均分成的份数',rationale:'除号前面是总数（8），后面是份数（2），等号后面是每份个数（4）。'},
{questionId:'v4',type:'steps',prompt:'把 10 个苹果平均放进 2 个盘子，每个盘子放几个？写出算式，并说说算式里每个数表示什么。',expectedAnswer:'10÷2=5，10 是总数，2 是份数，5 是每份个数',rationale:'平均分用除法：总数÷份数=每份个数。',
 keyPointLabels:['算式','总数','份数'],
 keyPoints:[['10÷2','10除以2'],['10','总数'],['2','份数','两盘','2个盘子'],['5','每份','每盘']]} ]};

/* 表内乘法和表内除法（二）·原创测验（对齐「7～9 口诀、乘除互逆、连乘连除」认知目标） */
export const sjRecipe7to9Quiz:Quiz={ quizId:'sj2a-recipe79-quiz-01', questions:[
{questionId:'c1',type:'fill',prompt:'七八五十六，所以 7×8=____。',expectedAnswer:'56',rationale:'口诀「七八五十六」，7×8 和 8×7 都得 56。'},
{questionId:'c2',type:'choice',prompt:'用「七八五十六」这句口诀，不能算下面哪道题？',options:['56÷8','7×8','49÷7'],expectedAnswer:'49÷7',rationale:'49÷7 想的是「七七四十九」，不是七八五十六。'},
{questionId:'c3',type:'steps',prompt:'算 2×3×4，写出你先算哪一步、再算哪一步，最后结果是多少。',expectedAnswer:'先算 2×3=6，再算 6×4=24',rationale:'连乘从左往右算：先算 2×3=6，再算 6×4=24。',
 keyPointLabels:['第一步','第二步','结果'],
 keyPoints:[['2×3','2乘3','6'],['6×4','6乘4'],['24']]} ]};

/* 观察物体·原创测验（对齐「不同位置看到不同形状」认知目标） */
export const sjObserveQuiz:Quiz={ quizId:'sj2a-observe-quiz-01', questions:[
{questionId:'o1',type:'choice',prompt:'同一个水杯，站在正面和站在侧面看，看到的形状一样吗？',options:['可能不一样','一定完全一样','侧面看不到'],expectedAnswer:'可能不一样',rationale:'同一个物体，站在不同位置看到的形状可能不同。'},
{questionId:'o2',type:'fill',prompt:'从前、后、左、右四个方向观察物体，每次能看到的 ____ 面。（填一个数字）',expectedAnswer:'1',rationale:'每次观察只看到对着自己的那一面。'},
{questionId:'o3',type:'steps',prompt:'如果看到的是一只茶杯的侧面图，观察者可能站在哪里？说说你是怎么判断的。',expectedAnswer:'站在侧面（左面或右面）；因为看到的是侧面，说明观察者正对着侧面',rationale:'看到什么面，观察者就在对应的方向上。',
 keyPointLabels:['位置','判断依据'],
 keyPoints:[['侧','左','右','旁'],['看到','对着','说明','因为']]} ]};

/* 期末复习·原创测验（对齐二上综合复习：加减、乘除、单位与图形） */
export const sj2aReviewQuiz:Quiz={ quizId:'sj2a-review-quiz-01', questions:[
{questionId:'r1',type:'fill',prompt:'47+28=____（个位满十向十位进 1）。',expectedAnswer:'75',rationale:'个位 7+8=15，写 5 进 1；十位 4+2+1=7，结果 75。'},
{questionId:'r2',type:'choice',prompt:'量课桌的高度，用哪个单位最合适？',options:['厘米','米','千米'],expectedAnswer:'厘米',rationale:'课桌大约 70 厘米高，比 1 米短，用厘米合适。'},
{questionId:'r3',type:'steps',prompt:'36÷6=？写出算式结果，并说说你用了哪句口诀。',expectedAnswer:'36÷6=6，想「六六三十六」',rationale:'除法求商用乘法口诀：36÷6 想「六六三十六」，商是 6。',
 keyPointLabels:['结果','口诀'],
 keyPoints:[['6'],['六六三十六','六六']]} ]};

export const sjQuizByLesson:Record<string,Quiz>={
  'sj2a-unit1-addsub':sjAddSubQuiz,
  'sj2a-unit1-practice':sjAddSubQuiz,
  'sj2a-unit2-quadrilateral':sjGeometryQuiz,
  'sj2a-unit3-multiply1':sjMultiplicationQuiz,
  'sj2a-unit3-multiply2':sjMultiplicationQuiz,
  'sj2a-unit4-division':sjDivisionQuiz,
  'sj2a-unit4-length':sjLengthQuiz,
  'sj2a-unit6-recipe7to9':sjRecipe7to9Quiz,
  'sj2a-unit7-observe':sjObserveQuiz,
  'sj2a-unit8-review':sj2aReviewQuiz,
};

/* quizId → lessonId 反查：批改/收单阶段只有 quiz，靠它找回对应课的学习包（与 sjQuizByLesson 互为镜像） */
export const sjLessonIdByQuiz:Record<string,string>=Object.fromEntries(Object.entries(sjQuizByLesson).map(([lessonId,quiz])=>[quiz.quizId,lessonId]));
/* 批改时的按课提示：答错题的思路反馈必须与本课内容一致，不再按族套模板 */
export const gradingHintByQuiz:Record<string,string>=Object.fromEntries(Object.entries(sjLessonIdByQuiz).map(([quizId,lessonId])=>[quizId,sjLessonPacks[lessonId]?.cue??'']));

/* 演示书目录只保留苏教版对齐原创教材（5 课）。
   早期的「分数侦探」演示书与「待授权目录示例」占位已移除：
   任意材料路径已切换真实 AI 生成（#6/#8），假分数演示书失去了存在价值且会制造内容错配；
   目录占位仅服务开发期 UI 状态展示，对学习者无价值。
   demoQuiz（fraction-quiz-01）仍保留——它是引擎/批改测试的固定夹具，不再出现在任何教材目录。 */
export const demoTextbooks:Textbook[]=[sjGrade2aTextbook,ywGrade2aTextbook,sjGrade2bTextbook,ywGrade2bTextbook];
