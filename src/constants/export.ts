import type { ExportConfig } from '@/types'

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'pdf',
  paperSize: 'A4',
  orientation: 'portrait',
  includePageNumbers: false,
  includeHeader: false,
  includeFooter: false,
  cssTheme: 'github',
}
