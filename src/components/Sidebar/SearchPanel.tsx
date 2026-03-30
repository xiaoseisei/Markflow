import { memo, useState, useCallback, useEffect } from 'react'
import type { FileNode, SearchResultSummary } from '@/types'
import { searchInWorkspace, getSearchStats, formatSearchResult } from '@/utils/search'
import { cn } from '@/utils/cn'

interface SearchPanelProps {
  nodes: FileNode[]
  onOpenFile: (path: string) => void
  onClose?: () => void
}

export const SearchPanel = memo(function SearchPanel({ nodes, onOpenFile, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResultSummary[]>([])
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [selectedResult, setSelectedResult] = useState<string | null>(null)

  /**
   * 执行搜索
   */
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    setSelectedResult(null)

    try {
      const searchResults = await searchInWorkspace(nodes, query, {
        caseSensitive,
        maxResults: 200,
      })
      setResults(searchResults)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setIsSearching(false)
    }
  }, [nodes, query, caseSensitive])

  /**
   * 清空搜索
   */
  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    setSelectedResult(null)
  }, [])

  /**
   * 回车键触发搜索
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch()
      } else if (e.key === 'Escape') {
        handleClear()
        onClose?.()
      }
    },
    [handleSearch, handleClear, onClose],
  )

  /**
   * 点击搜索结果打开文件
   */
  const handleResultClick = useCallback(
    (path: string, line: number) => {
      onOpenFile(path)
      setSelectedResult(`${path}:${line}`)
    },
    [onOpenFile],
  )

  // 自动搜索（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, caseSensitive, handleSearch])

  // 统计信息
  const stats = results.length > 0 ? getSearchStats(results) : null

  return (
    <div className="flex flex-col gap-2">
      {/* 搜索输入框 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            className={cn(
              'w-full rounded-md border border-border bg-background px-3 py-2',
              'text-sm placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            disabled={isSearching}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索..."
            type="text"
            value={query}
          />
          {query && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 搜索选项 */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            checked={caseSensitive}
            className="h-3 w-3 rounded border-border"
            onChange={(e) => setCaseSensitive(e.target.checked)}
            type="checkbox"
          />
          区分大小写
        </label>
      </div>

      {/* 搜索状态 */}
      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="animate-spin">⏳</span>
          搜索中...
        </div>
      )}

      {/* 搜索结果统计 */}
      {stats && !isSearching && (
        <div className="text-sm text-muted-foreground">
          找到 <span className="font-medium text-foreground">{stats.totalMatches}</span> 个匹配项，
          来自 <span className="font-medium text-foreground">{stats.totalFiles}</span> 个文件
        </div>
      )}

      {/* 搜索结果列表 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {results.length === 0 && query.trim() && !isSearching && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            未找到匹配结果
          </div>
        )}

        {results.length === 0 && !query.trim() && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            输入关键词开始搜索
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {results.map((fileResult) => (
            <div
              className={cn(
                'rounded-md border border-border bg-card p-2',
                'transition-colors hover:border-ring',
              )}
              key={fileResult.path}
            >
              {/* 文件标题 */}
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <span className="text-sm font-medium">{fileResult.fileName}</span>
                <span className="text-xs text-muted-foreground">
                  {fileResult.count} 个匹配
                </span>
              </div>

              {/* 匹配的行 */}
              <div className="mt-1.5 space-y-0.5">
                {fileResult.results.slice(0, 10).map((result, index) => (
                  <button
                    className={cn(
                      'block w-full rounded px-2 py-1 text-left text-sm',
                      'transition-colors hover:bg-accent',
                      selectedResult === `${result.path}:${result.line}` &&
                        'bg-accent',
                    )}
                    key={`${result.line}-${index}`}
                    onClick={() => handleResultClick(result.path, result.line)}
                    title={result.content}
                    type="button"
                  >
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-xs text-muted-foreground w-6">
                        {result.line}
                      </span>
                      <span
                        className="overflow-hidden text-ellipsis whitespace-nowrap"
                        dangerouslySetInnerHTML={{
                          __html: formatSearchResult(result, query, caseSensitive),
                        }}
                      />
                    </div>
                  </button>
                ))}

                {fileResult.results.length > 10 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    还有 {fileResult.results.length - 10} 个匹配...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
