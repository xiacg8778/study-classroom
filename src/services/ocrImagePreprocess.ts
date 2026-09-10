/**
 * OCR 前图像预处理（纯函数、canvas 实现，仅浏览器本地运行）。
 *
 * 目标：提升 Tesseract 对手写体/低对比度样本的识别质量。
 * - 小图放大：短边 <1000px 时放大到 1000px（Tesseract 对小字识别差）
 * - 灰度化 + 对比度拉伸：把亮度分布线性拉伸到全范围，改善淡墨/不均匀
 * - Otsu 自适应二值化：按直方图自动选阈值，抗光照不均；可选（对彩色底纹图更稳）
 *
 * 边界：仅使用 <canvas> 2D，不上传、不引入新依赖；输入输出都是 ImageBitmap/canvas。
 */

export interface PreprocessResult {
  canvas:HTMLCanvasElement;
  width:number;
  height:number;
  /** 实际执行的步骤（诊断展示用） */
  steps:string[];
}

/** ITU-R BT.601 灰度 */
const toGray=(r:number,g:number,b:number):number=>(r*299+g*587+b*114)/1000;

export function preprocessForOcr(source:ImageBitmap|HTMLCanvasElement,options:{binarize?:boolean}={}):PreprocessResult{
  const steps:string[]=[];
  /* 1) 放大：短边目标 1000px，最大放大 4 倍（过放大会引入插值噪声） */
  const minSide=Math.min(source.width,source.height);
  const scale=minSide<1000?Math.min(4,1000/minSide):1;
  const width=Math.max(1,Math.round(source.width*scale));
  const height=Math.max(1,Math.round(source.height*scale));
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)throw new Error('OCR_UNAVAILABLE');
  context.fillStyle='#ffffff';
  context.fillRect(0,0,width,height);
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  context.drawImage(source,0,0,width,height);
  if(scale>1)steps.push(`放大 ${scale.toFixed(2)}×`);
  const imageData=context.getImageData(0,0,width,height);
  const data=imageData.data;

  /* 2) 灰度 + 直方图 */
  const gray=new Uint8ClampedArray(width*height);
  const histogram=new Uint32Array(256);
  for(let i=0,p=0;i<data.length;i+=4,p+=1){
    const value=toGray(data[i],data[i+1],data[i+2]);
    gray[p]=value;
    histogram[gray[p]]+=1;
  }

  /* 3) 对比度拉伸：1%–99% 分位线性拉伸（抗个别极值点） */
  const total=width*height;
  const lowCut=total*0.01;
  const highCut=total*0.99;
  let cumulative=0;
  let low=0;
  let high=255;
  for(let v=0;v<256;v+=1){
    cumulative+=histogram[v];
    if(cumulative>=lowCut){low=v;break;}
  }
  cumulative=0;
  for(let v=0;v<256;v+=1){
    cumulative+=histogram[v];
    if(cumulative>=highCut){high=v;break;}
  }
  if(high>low){
    const lut=new Uint8ClampedArray(256);
    for(let v=0;v<256;v+=1){
      const stretched=((v-low)*255)/(high-low);
      lut[v]=Math.min(255,Math.max(0,stretched));
    }
    for(let p=0;p<gray.length;p+=1)gray[p]=lut[gray[p]];
    if(low>0||high<255)steps.push(`对比度拉伸 ${low}–${high}`);
  }

  /* 4) Otsu 二值化（可选） */
  if(options.binarize){
    let sum=0;
    for(let v=0;v<256;v+=1)sum+=v*histogram[v];
    let sumB=0;
    let weightB=0;
    let bestVariance=0;
    let threshold=127;
    for(let v=0;v<256;v+=1){
      weightB+=histogram[v];
      if(weightB===0)continue;
      const weightF=total-weightB;
      if(weightF===0)break;
      sumB+=v*histogram[v];
      const meanB=sumB/weightB;
      const meanF=(sum-sumB)/weightF;
      const variance=weightB*weightF*(meanB-meanF)*(meanB-meanF);
      if(variance>bestVariance){bestVariance=variance;threshold=v;}
    }
    for(let p=0;p<gray.length;p+=1)gray[p]=gray[p]>threshold?255:0;
    steps.push(`Otsu 二值化(${threshold})`);
  }

  /* 写回（二值/拉伸后的灰度） */
  for(let p=0;p<gray.length;p+=1){
    const offset=p*4;
    data[offset]=gray[p];
    data[offset+1]=gray[p];
    data[offset+2]=gray[p];
    data[offset+3]=255;
  }
  context.putImageData(imageData,0,0);
  return{canvas,width,height,steps:steps.length>0?steps:['原图直通']};
}
