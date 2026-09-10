#!/usr/bin/env node
/* 测试用 mock OpenAI 兼容上游：固定返回符合 lesson/grading schema 的 JSON。仅用于本地全链验证。 */
import { createServer } from 'node:http';

const lesson = { objective: '理解进位加法：个位满十向十位进一', steps: [{ title: '先看个位', body: '7+8=15，满十了', action: '把个位相加并标记满十', visualCue: '个位标进1' }, { title: '再算十位', body: '4+2 再加进上来的 1', action: '算十位并加上进位', visualCue: '十位加1' }, { title: '验算确认', body: '用 75-28 倒算检查', action: '倒算一遍验证', visualCue: '差加减数' }] };
const grading = { items: [{ questionId: 'q1', thinkingFeedback: '个位满十记得进一，很好。', errorCause: 'undetermined' }] };

createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    const isGrading = raw.includes('thinkingFeedback');
    const content = JSON.stringify(isGrading ? grading : lesson);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
}).listen(4620, '127.0.0.1', () => console.log('[mock-upstream] on 4620'));
