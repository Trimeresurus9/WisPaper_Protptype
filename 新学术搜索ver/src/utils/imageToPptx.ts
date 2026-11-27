const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

export function getImagePptxFilename(name: string) {
  const stem = name
    .replace(/\.(?:png|jpe?g)$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .trim()
    .replace(/[. ]+$/, '');
  return `${stem || '图片'}.pptx`;
}

export async function readPptxImage(file: File) {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  let mime: string;
  if (PNG_SIGNATURE.every((byte, i) => header[i] === byte)) {
    mime = 'image/png';
  } else if (JPEG_SIGNATURE.every((byte, i) => header[i] === byte)) {
    mime = 'image/jpeg';
  } else {
    throw new Error('请选择 PNG 或 JPG 格式的图片');
  }

  const blob = file.slice(0, file.size, mime);
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight, blob };
  } catch {
    throw new Error('无法读取这张图片，请重新选择');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readImageDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('无法读取这张图片，请重试'));
    reader.readAsDataURL(blob);
  });
}

export async function createImagePptx(file: File): Promise<Blob> {
  const image = await readPptxImage(file);
  const [{ default: PptxGenJS }, data] = await Promise.all([
    import('pptxgenjs'),
    readImageDataUrl(image.blob),
  ]);
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_16x9';
  presentation.author = 'WisPaper';
  presentation.title = getImagePptxFilename(file.name).slice(0, -5);

  // The library's standard 16:9 layout is 10 x 5.625 inches.
  const slideWidth = 10;
  const slideHeight = 5.625;
  const scale = Math.min(slideWidth / image.width, slideHeight / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  const slide = presentation.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addImage({
    data,
    x: (slideWidth - w) / 2,
    y: (slideHeight - h) / 2,
    w,
    h,
    altText: presentation.title,
  });
  const output = await presentation.write({ outputType: 'blob' }) as Blob;
  return output.slice(0, output.size, PPTX_MIME);
}
