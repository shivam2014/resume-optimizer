import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const TEMPLATES_DIR = path.join(process.cwd(), "public/templates")

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith(".tex")) {
      return NextResponse.json(
        { error: "Only .tex files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 1MB" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const templateId = uuidv4()
    const fileName = `${templateId}.tex`
    const filePath = path.join(TEMPLATES_DIR, fileName)

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({
      id: templateId,
      name: file.name,
      createdAt: new Date().toISOString(),
      isCustom: true
    })
  } catch (error) {
    console.error("Template upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload template" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    // Find and delete template file
    const files = await fs.readdir(TEMPLATES_DIR)
    const templateFile = files.find(file => file.startsWith(templateId))

    if (!templateFile) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    await fs.unlink(path.join(TEMPLATES_DIR, templateFile))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Template deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}