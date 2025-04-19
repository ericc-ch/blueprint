import { Hono } from "hono"
import { cors } from "hono/cors"
import { serveStatic } from "hono/serve-static.bun"
import { StatusCode } from "hono/utils/http-status"
import fs from "node:fs/promises"
import path from "node:path"

const app = new Hono()

// Enable CORS
app.use(cors())

// Base API route for filesystem operations
const fsApi = app.basePath("/api/fs")

// Get directory listing
fsApi.get("/list/:path*", async (c) => {
  try {
    const dirPath = c.req.param("path") || "/"
    const absolutePath = path.resolve(dirPath)

    const stats = await fs.stat(absolutePath)

    if (stats.isDirectory()) {
      const files = await fs.readdir(absolutePath)

      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(absolutePath, file)
          const stats = await fs.stat(filePath)
          return {
            name: file,
            path: path.join(dirPath, file),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
          }
        }),
      )

      return c.json(fileStats)
    } else {
      return c.json(
        {
          error: "Not a directory",
        },
        400 as StatusCode,
      )
    }
  } catch (error) {
    console.error("Directory listing error:", error)
    return c.json(
      {
        error: "Failed to list directory",
        message: error instanceof Error ? error.message : String(error),
      },
      500 as StatusCode,
    )
  }
})

// Read file contents
fsApi.get("/read/:path*", async (c) => {
  try {
    const filePath = c.req.param("path") || ""
    const absolutePath = path.resolve(filePath)

    const stats = await fs.stat(absolutePath)

    if (stats.isFile()) {
      const content = await fs.readFile(absolutePath, "utf8")
      return c.json({ content })
    } else {
      return c.json(
        {
          error: "Not a file",
        },
        400 as StatusCode,
      )
    }
  } catch (error) {
    console.error("File reading error:", error)
    return c.json(
      {
        error: "Failed to read file",
        message: error instanceof Error ? error.message : String(error),
      },
      500 as StatusCode,
    )
  }
})

// Write file contents
fsApi.post("/write/:path*", async (c) => {
  try {
    const filePath = c.req.param("path") || ""
    const absolutePath = path.resolve(filePath)

    const { content } = await c.req.json<{ content: string }>()

    // Ensure the directory exists
    const dirPath = path.dirname(absolutePath)
    await fs.mkdir(dirPath, { recursive: true })

    await fs.writeFile(absolutePath, content, "utf-8")

    return c.json({ success: true })
  } catch (error) {
    console.error("File writing error:", error)
    return c.json(
      {
        error: "Failed to write file",
        message: error instanceof Error ? error.message : String(error),
      },
      500 as StatusCode,
    )
  }
})

// Create directory
fsApi.post("/mkdir/:path*", async (c) => {
  try {
    const dirPath = c.req.param("path") || ""
    const absolutePath = path.resolve(dirPath)

    await fs.mkdir(absolutePath, { recursive: true })

    return c.json({ success: true })
  } catch (error) {
    console.error("Directory creation error:", error)
    return c.json(
      {
        error: "Failed to create directory",
        message: error instanceof Error ? error.message : String(error),
      },
      500 as StatusCode,
    )
  }
})

// Delete file or directory
fsApi.delete("/delete/:path*", async (c) => {
  try {
    const targetPath = c.req.param("path") || ""
    const absolutePath = path.resolve(targetPath)

    const stats = await fs.stat(absolutePath)

    await (stats.isDirectory() ?
      fs.rm(absolutePath, { recursive: true })
    : fs.unlink(absolutePath))

    return c.json({ success: true })
  } catch (error) {
    console.error("Deletion error:", error)
    return c.json(
      {
        error: "Failed to delete item",
        message: error instanceof Error ? error.message : String(error),
      },
      500 as StatusCode,
    )
  }
})

// Rename file or directory
fsApi.put("/rename", async (c) => {
  try {
    const { oldPath, newPath } = await c.req.json<{
      oldPath: string
      newPath: string
    }>()

    const absoluteOldPath = path.resolve(oldPath)
    const absoluteNewPath = path.resolve(newPath)

    await fs.rename(absoluteOldPath, absoluteNewPath)

    return c.json({ success: true })
  } catch (error) {
    console.error("Rename error:", error)
    return c.json(
      {
        error: "Failed to rename item",
        message: error instanceof Error ? error.message : String(error),
      },
      500 as StatusCode,
    )
  }
})

// Get file stats
fsApi.get("/stats/:path*", async (c) => {
  try {
    const itemPath = c.req.param("path") || ""
    const absolutePath = path.resolve(itemPath)

    const stats = await fs.stat(absolutePath)

    return c.json({
      path: itemPath,
      isDirectory: stats.isDirectory(),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return c.json(
      {
        error: "Failed to get item stats",
        message: error instanceof Error ? error.message : String(error),
      },
      500 as StatusCode,
    )
  }
})

// Serve static files (optional)
app.use("/*", serveStatic({ root: "./public" }))

// Export for use in main server file
export default app
