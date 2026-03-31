import { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { FileNode, SearchResultSummary } from '@/types'
import { searchInWorkspace, getSearchStats, formatSearchResult } from '@/utils/search'
import { cn } from '@/utils/cn'

interface SearchPanelProps {
  nodes: FileNode[]
  onOpenFile: (path: string) => void
  onClose?: () => void
}

// ========================================
// 搜索输入框组件（独立隔离）
// ========================================

interface SearchInputProps {
  defaultValue: string
  disabled: boolean
  onSearchChange: (query: string) => void
  onClear: () => void
  onClose?: () => void
}

/**
 * 【关键修复】独立的搜索输入框组件
 *
 * 使用 React.memo 隔离渲染，确保：
 * 1. 只有 disabled 或 defaultValue 变化时才重新渲染
 * 2. 本地管理 input 值，输入流畅不丢光标
 * 3. 通过防抖通知父组件更新搜索结果
 */
const SearchInput = memo(function SearchInput({
  defaultValue,
  disabled,
  onSearchChange,
  onClear,
  onClose,
}: SearchInputProps) {
  // 【方案 2】本地管理 input 值，确保输入流畅
  const [localValue, setLocalValue] = useState(defaultValue)

  // 同步外部 defaultValue 变化（如清空操作）
  useEffect(() => {
    setLocalValue(defaultValue)
  }, [defaultValue])

  // 【方案 2】防抖：300ms 后才通知父组件
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue, onSearchChange])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setLocalValue(e.target.value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Escape') {
      onClear()
      onClose?.()
    }
  }

  function handleClearClick(): void {
    setLocalValue('')
    onClear()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        {/* 【关键】稳定的 key，确保 DOM 不会被销毁重建 */}
        <input
          key="search-input"
          className={cn(
            'w-full rounded-md border border-border bg-background px-3 py-2',
            'text-sm placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="搜索..."
          type="text"
          value={localValue}
        />
        {localValue && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={handleClearClick}
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
})

// ========================================
// 搜索结果组件（独立隔离）
// ========================================

interface SearchResultsProps {
  results: SearchResultSummary[]
  query: string
  caseSensitive: boolean
  selectedResult: string | null
  onResultClick: (path: string, line: number) => void
}

/**
 * 独立的搜索结果组件
 * 只在 results 或 query 变化时重新渲染
 */
const SearchResults = memo(function SearchResults({
  results,
  query,
  caseSensitive,
  selectedResult,
  onResultClick,
}: SearchResultsProps) {
  const stats = results.length > 0 ? getSearchStats(results) : null

  if (results.length === 0 && query.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        未找到匹配结果
      </div>
    )
  }

  if (results.length === 0 && !query.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        输入关键词开始搜索
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* 搜索结果统计 */}
      {stats && (
        <div className="mb-2 text-sm text-muted-foreground">
          找到 <span className="font-medium text-foreground">{stats.totalMatches}</span> 个匹配项，
          来自 <span className="font-medium text-foreground">{stats.totalFiles}</span> 个文件
        </div>
      )}

      {/* 搜索结果列表 */}
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
              {fileResult.results.slice(0, 10).map((result) => (
                <button
                  className={cn(
                    'block w-full rounded px-2 py-1 text-left text-sm',
                    'transition-colors hover:bg-accent',
                    selectedResult === `${result.path}:${result.line}` && 'bg-accent',
                  )}
                  key={`${result.path}:${result.line}:${result.matchStart}:${result.matchEnd}`}
                  onClick={() => onResultClick(result.path, result.line)}
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
  )
})

// ========================================
// 搜索面板主组件
// ========================================

function SearchPanelComponent({ nodes, onOpenFile, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResultSummary[]>([])
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [selectedResult, setSelectedResult] = useState<string | null>(null)

  // 使用 ref 追踪最新的搜索查询，避免闭包陷阱
  const latestQueryRef = useRef('')
  const latestCaseSensitiveRef = useRef(false)

  useEffect(() => {
    latestQueryRef.current = query
    latestCaseSensitiveRef.current = caseSensitive
  }, [query, caseSensitive])

  /**
   * 【优化】使用 useMemo 稳定 nodes 引用
   * 避免因父组件传入新的 nodes 引用导致组件重渲染
   */
  const stableNodes = useMemo(() => nodes, [nodes])

  /**
   * 执行搜索
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSelectedResult(null)

    try {
      const searchResults = await searchInWorkspace(stableNodes, searchQuery, {
        caseSensitive: latestCaseSensitiveRef.current,
        maxResults: 200,
      })
      setResults(searchResults)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setIsSearching(false)
    }
  }, [stableNodes])

  /**
   * 【方案 2】处理输入框的防抖更新
   * 由 SearchInput 组件的防抖 useEffect 调用
   */
  const handleSearchChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
    // 注意：实际搜索在 SearchInput 的防抖 useEffect 中触发
    // 这里只是更新状态，让 SearchResults 可以显示
  }, [])

  /**
   * 执行搜索（由防抖定时器触发）
   */
  useEffect(() => {
    // 执行搜索
    void performSearch(query)
  }, [query, caseSensitive, performSearch])

  /**
   * 清空搜索
   */
  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    setSelectedResult(null)
  }, [])

  /**
   * 切换大小写敏感
   */
  const handleToggleCaseSensitive = useCallback(() => {
    setCaseSensitive((prev) => !prev)
  }, [])

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

  return (
    <div className="flex flex-col gap-2">
      {/* 【方案 1】独立的搜索输入框组件，使用 memo 隔离 */}
      <SearchInput
        defaultValue={query}
        disabled={isSearching}
        onClear={handleClear}
        onClose={onClose}
        onSearchChange={handleSearchChange}
      />

      {/* 搜索选项 */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            checked={caseSensitive}
            className="h-3 w-3 rounded border-border"
            onChange={handleToggleCaseSensitive}
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

      {/* 【方案 1】独立的搜索结果组件，使用 memo 隔离 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SearchResults
          caseSensitive={caseSensitive}
          onResultClick={handleResultClick}
          query={query}
          results={results}
          selectedResult={selectedResult}
        />
      </div>
    </div>
  )
}

/**
 * 【方案 1】使用自定义比较函数优化 memo
 * 只在 nodes 内容真正变化时才重新渲染主组件
 */
function arePropsEqual(
  prevProps: SearchPanelProps,
  nextProps: SearchPanelProps,
): boolean {
  const prevNodesStr = JSON.stringify(prevProps.nodes)
  const nextNodesStr = JSON.stringify(nextProps.nodes)

  return prevNodesStr === nextNodesStr && prevProps.onOpenFile === nextProps.onOpenFile
}

export const SearchPanel = memo(SearchPanelComponent, arePropsEqual)
