// BeautyM - 파일 업로드 API (Vercel Blob + 로컬 fallback)
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // Vercel 환경: Blob Storage 사용
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const ext = file.name.split('.').pop() || 'png';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      const blob = await put(filename, file, {
        access: 'public',
      });

      return NextResponse.json({
        success: true,
        url: blob.url,
        filename: file.name,
      });
    }

    // 로컬 환경: 파일 시스템 사용
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename: file.name,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '업로드 실패' }, { status: 500 });
  }
}
