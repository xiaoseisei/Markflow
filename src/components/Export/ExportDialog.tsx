import { memo, useMemo, useState } from 'react'
import { Dialog, Button } from '@/components/ui'
import { DEFAULT_EXPORT_CONFIG } from '@/constants/export'
import type { ExportConfig, ExportFormat } from '@/types'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (config: ExportConfig) => Promise<void>
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'pdf', label: 'PDF', description: '通过系统打印对话框导出 PDF' },
  { value: 'html', label: 'HTML', description: '独立的 HTML 文件，包含内联样式' },
  { value: 'markdown', label: 'Markdown', description: '原始 Markdown 文本' },
]

const PAPER_SIZE_OPTIONS: { value: ExportConfig['paperSize']; label: string }[] = [
  { value: 'A4', label: 'A4' },
  { value: 'Letter', label: 'Letter' },
  { value: 'A3', label: 'A3' },
]

const ORIENTATION_OPTIONS: { value: ExportConfig['orientation']; label: string }[] = [
  { value: 'portrait', label: '纵向' },
  { value: 'landscape', label: '横向' },
]

const CSS_THEME_OPTIONS: { value: ExportConfig['cssTheme']; label: string }[] = [
  { value: 'github', label: 'GitHub' },
  { value: 'minimal', label: '极简' },
  { value: 'academic', label: '学术' },
]

export const ExportDialog = memo(function ExportDialog({ open, onClose, onConfirm }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_EXPORT_CONFIG.format)
  const [paperSize, setPaperSize] = useState<ExportConfig['paperSize']>(DEFAULT_EXPORT_CONFIG.paperSize)
  const [orientation, setOrientation] = useState<ExportConfig['orientation']>(DEFAULT_EXPORT_CONFIG.orientation)
  const [cssTheme, setCssTheme] = useState<ExportConfig['cssTheme']>(DEFAULT_EXPORT_CONFIG.cssTheme)

  const config = useMemo<ExportConfig>(
    () => ({
      format,
      paperSize,
      orientation,
      includePageNumbers: DEFAULT_EXPORT_CONFIG.includePageNumbers,
      includeHeader: DEFAULT_EXPORT_CONFIG.includeHeader,
      includeFooter: DEFAULT_EXPORT_CONFIG.includeFooter,
      cssTheme,
    }),
    [format, paperSize, orientation, cssTheme],
  )

  const selectedFormat = FORMAT_OPTIONS.find((f) => f.value === format)

  return (
    <Dialog
      description={selectedFormat?.description}
      onClose={onClose}
      open={open}
      title="导出文档"
    >
      <div className="space-y-4">
        {/* 导出格式 */}
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">导出格式</span>
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  format === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => setFormat(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </label>

        {/* PDF/HTML 专用选项 */}
        {format === 'pdf' || format === 'html' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">纸张大小</span>
                <select
                  className="rounded-md border border-border bg-background px-3 py-2"
                  onChange={(event) => setPaperSize(event.target.value as ExportConfig['paperSize'])}
                  value={paperSize}
                >
                  {PAPER_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">方向</span>
                <select
                  className="rounded-md border border-border bg-background px-3 py-2"
                  onChange={(event) => setOrientation(event.target.value as ExportConfig['orientation'])}
                  value={orientation}
                >
                  {ORIENTATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">样式主题</span>
              <select
                className="rounded-md border border-border bg-background px-3 py-2"
                onChange={(event) => setCssTheme(event.target.value as ExportConfig['cssTheme'])}
                value={cssTheme}
              >
                {CSS_THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            取消
          </Button>
          <Button
            onClick={() => {
              void onConfirm(config)
            }}
          >
            导出
          </Button>
        </div>
      </div>
    </Dialog>
  )
})
