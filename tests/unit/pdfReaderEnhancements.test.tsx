import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {LocalDocumentPort} from '../../src/adapters/ports/LocalDocumentPort';
import {PdfReader} from '../../src/features/reader/PdfReader';

const dispatch=vi.fn();
const renderPage=vi.fn<LocalDocumentPort['renderPage']>().mockResolvedValue(undefined);
const createSelection=vi.fn<LocalDocumentPort['createSelection']>();
const speak=vi.fn();

vi.mock('../../src/state/LearningSessionProvider',()=>({
  useLearningSession:()=>({documents:{renderPage,createSelection},dispatch,speech:{supported:()=>true,speak},learnerId:'learner-test'}),
}));

const document={
  documentId:'local-test',
  fileName:'两页测试.pdf',
  pageCount:2,
  textByPage:['第一页面积公式与例题。','第二页分数加法与练习。'],
  contentDigest:'digest-test-0123',
};

describe('PDF reader enhancements',()=>{
  afterEach(()=>cleanup());

  beforeEach(()=>{
    dispatch.mockReset();
    renderPage.mockClear();
    createSelection.mockReset();
    speak.mockClear();
    localStorage.clear();/* 阅读器现在会持久化批注元数据，用例间必须隔离存储 */
  });

  it('navigates pages and clamps manual page input',()=>{
    render(<PdfReader document={document}/>);
    expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'下一页'}));
    expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('跳到页码'),{target:{value:'99'}});
    fireEvent.click(screen.getByRole('button',{name:'前往'}));
    expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument();
  });

  it('searches page text and navigates from a result',()=>{
    render(<PdfReader document={document}/>);
    fireEvent.change(screen.getByLabelText('搜索 PDF 全文'),{target:{value:'分数'}});
    expect(screen.getByText('找到 1 页')).toBeInTheDocument();
    expect(screen.getByText(/第二页分数加法与练习/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'第 2 页'}));
    expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument();
  });

  it('adds and removes session-only bookmarks',()=>{
    render(<PdfReader document={document}/>);
    fireEvent.click(screen.getByRole('button',{name:'标记本页'}));
    expect(screen.getByRole('navigation',{name:'当前 PDF 书签'})).toHaveTextContent('第 1 页');
    expect(screen.getByRole('button',{name:'移除本页书签'})).toHaveAttribute('aria-pressed','true');
    fireEvent.click(screen.getByRole('button',{name:'移除本页书签'}));
    expect(screen.queryByRole('navigation',{name:'当前 PDF 书签'})).not.toBeInTheDocument();
  });

  it('opens thumbnail navigation and jumps to a page',()=>{
    render(<PdfReader document={document}/>);
    expect(screen.queryByRole('navigation',{name:'PDF 缩略图导航'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'缩略图导航'}));
    const toggle=screen.getByRole('button',{name:'收起缩略图'});
    expect(toggle).toHaveAttribute('aria-pressed','true');
    const strip=screen.getByRole('navigation',{name:'PDF 缩略图导航'});
    expect(strip).toBeInTheDocument();
    fireEvent.click(within(strip).getByRole('button',{name:'跳到第 2 页'}));
    expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'收起缩略图'}));
    expect(screen.queryByRole('navigation',{name:'PDF 缩略图导航'})).not.toBeInTheDocument();
  });

  it('adds, jumps to and removes session-only highlights',()=>{
    render(<PdfReader document={document}/>);
    fireEvent.click(screen.getByRole('button',{name:'划线这段'}));
    const highlightList=screen.getByRole('region',{name:'当前 PDF 划线'});
    expect(highlightList).toHaveTextContent('第 1 页');
    expect(within(highlightList).getAllByRole('listitem')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:'下一页'}));
    fireEvent.click(screen.getByRole('button',{name:'跳转'}));
    expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'移除'}));
    expect(screen.queryByRole('region',{name:'当前 PDF 划线'})).not.toBeInTheDocument();
  });

  it('tracks reading progress and resumes from offset',()=>{
    render(<PdfReader document={document}/>);
    expect(screen.getByText('本页尚未朗读')).toBeInTheDocument();
    speak.mockClear();
    fireEvent.click(screen.getByRole('button',{name:'朗读本页'}));
    expect(speak).toHaveBeenCalledWith('第一页面积公式与例题。');
    fireEvent.click(screen.getByRole('button',{name:'记为已读'}));
    expect(screen.getByText('本页已读完')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'下一页'}));
    expect(screen.getByText('本页尚未朗读')).toBeInTheDocument();
  });

  it('keeps highlight styles off MUI button internals',()=>{
    // 回归守卫：.pdf-highlights li span 这类裸后代选择器会命中 MUI 懒挂载的
    // TouchRipple 覆盖层（真实鼠标点击后插入、不再移除），把按钮染成不透明
    // 黄块盖住文字。此类选择器必须用 > 限定为直接子元素。
    const css=readFileSync('src/features/classroom/classroom.css','utf8');
    for(const forbidden of ['.pdf-highlights li span','.pdf-highlight-current span','.pdf-search-results li span']){
      expect(css,`${forbidden} 不得以裸后代选择器出现（会污染 MUI 按钮内部 span）`).not.toContain(forbidden+'{');
    }
    expect(css).toContain('.pdf-highlights li>span{');
  });
});
