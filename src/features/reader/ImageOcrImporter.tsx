import { Alert, Button, LinearProgress, TextField } from '@mui/material';
import CameraAltOutlined from '@mui/icons-material/CameraAltOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { useEffect, useRef, useState } from 'react';
import type { OcrDraft } from '../../contracts/ocr';
import { MaterialBoundaryService } from '../../services/MaterialBoundaryService';
import { gradeOcrConfidence } from '../../services/ocrConfidence';
import { useLearningSession } from '../../state/LearningSessionProvider';

type Phase = 'idle' | 'recognizing' | 'editing' | 'error';

export function ImageOcrImporter({ onText }: { onText(text: string): void }): JSX.Element {
  const { ocr, dispatch } = useLearningSession();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<OcrDraft>();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const jobRef = useRef(0);
  const abortRef = useRef<AbortController>();

  useEffect(() => () => {
    jobRef.current += 1;
    abortRef.current?.abort();
    void ocr.cancel();
  }, [ocr]);

  const choose = async (file?: File): Promise<void> => {
    if (!file) return;
    const job = ++jobRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('recognizing');
    setProgress(0);
    setError('');
    try {
      const result = await ocr.recognize(file, {
        signal: controller.signal,
        onProgress: (value) => {
          if (job === jobRef.current) setProgress(Math.round(value.progress * 100));
        },
      });
      if (job !== jobRef.current) return;
      setDraft(result);
      setText(result.text);
      setPhase('editing');
    } catch (reason) {
      if (job !== jobRef.current) return;
      const code = reason instanceof Error ? reason.message : 'OCR_FAILED';
      if (code === 'OCR_CANCELLED') {
        setPhase('idle');
        return;
      }
      setError(code === 'IMAGE_LIMIT_EXCEEDED'
        ? '图片过大或像素过高，请裁剪后重试。'
        : code === 'IMAGE_TYPE_MISMATCH' || code === 'IMAGE_TYPE_UNSUPPORTED'
          ? '仅支持扩展名、MIME 和内容一致的 JPG/PNG 图片。'
          : '本地识别失败，请换一张清晰图片或直接输入题目。');
      setPhase('error');
    } finally {
      if (job === jobRef.current) abortRef.current = undefined;
    }
  };

  const confirm = (): void => {
    if (!draft || !text.trim()) return;
    const boundary = new MaterialBoundaryService();
    const material = boundary.createReference({
      origin: 'local-image-ocr',
      documentId: draft.sourceId,
      page: 1,
      text,
    });
    dispatch({ type: 'ATTACH_MATERIAL', material });
    onText(material.quote);
    setDraft(undefined);
    setText('');
    setPhase('idle');
  };

  const cancel = (): void => {
    jobRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = undefined;
    void ocr.cancel();
    setDraft(undefined);
    setText('');
    setError('');
    setPhase('idle');
  };

  return <section aria-label="本地图片拍题" className="image-ocr">
    <Button component="label" startIcon={<CameraAltOutlined />} disabled={phase === 'recognizing'}>
      选择照片本地识别
      <input
        hidden
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        capture="environment"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void choose(file);
        }}
      />
    </Button>
    <p className="small-note">图片只在当前浏览器内识别，不上传、不保存；支持清晰印刷体 JPG/PNG。</p>
    {phase === 'recognizing' && <div role="status">
      <LinearProgress variant="determinate" value={progress} />
      <p>正在本地识别：{progress}%</p>
      <Button startIcon={<CloseOutlined />} onClick={cancel}>取消识别</Button>
    </div>}
    {phase === 'editing' && <div>
      {(() => {
        const grade = gradeOcrConfidence(draft?.confidence ?? 0, text);
        const severity = grade.tier === 'trusted' ? 'success' : grade.tier === 'suspect' ? 'warning' : 'error';
        return <Alert severity={severity}><strong>{grade.headline}</strong>（本地置信度 {Math.round(draft?.confidence ?? 0)}%）<br />{grade.guidance}</Alert>;
      })()}
      <TextField
        fullWidth
        multiline
        minRows={4}
        label="识别结果（确认前可修改）"
        value={text}
        onChange={(event) => setText(event.target.value)}
        inputProps={{ maxLength: 6000 }}
      />
      <Button variant="contained" disabled={!text.trim()} onClick={confirm}>确认作为题目</Button>
      <Button onClick={cancel}>放弃</Button>
    </div>}
    {phase === 'error' && <Alert severity="error">{error}</Alert>}
  </section>;
}
