export interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
}

export interface FileContent {
  content: string
}

export interface FileWriteRequest {
  content: string
}

export interface RenameRequest {
  oldPath: string
  newPath: string
}

export interface FileStats {
  path: string
  isDirectory: boolean
  size: number
  created: Date
  modified: Date
  accessed: Date
}

export interface ApiResponse {
  success: boolean
  error?: string
  message?: string
}
