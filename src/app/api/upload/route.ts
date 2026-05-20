import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save with timestamp to avoid collisions
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath: `./uploads/${fileName}`,
      fileName: file.name
    });
  } catch (error: any) {
    console.error("❌ Error subiendo archivo:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
