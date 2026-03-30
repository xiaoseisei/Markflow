/**
 * 全局搜索工具
 * 支持在工作区中跨文件搜索文本
 */

import type { FileNode, SearchResult, SearchResultSummary } from '@/types'
import { readFile } from '@/utils/fsAdapter'

/**
 * 搜索配置选项
 */
export interface SearchOptions {
  /** 是否区分大小写 */
  caseSensitive?: boolean
  /** 是否使用正则表达式 */
  useRegex?: boolean
  /** 最大结果数（防止搜索超大项目时卡顿） */
  maxResults?: number
  /** 要搜索的文件扩展名（空表示搜索所有文件） */
  fileExtensions?: string[]
}

/**
 * 获取所有 Markdown 文件路径
 * @param nodes - 文件树节点
 * @returns 所有 Markdown 文件的路径数组
 */
function getAllMarkdownFilePaths(nodes: FileNode[]): string[] {
  const paths: string[] = []

  function traverse(node: FileNode): void {
    if (node.type === 'file') {
      // 只搜索 Markdown 文件
      if (node.ext === 'md' || node.ext === 'markdown' || node.name.endsWith('.md')) {
        paths.push(node.path)
      }
    } else if (node.children) {
      node.children.forEach(traverse)
    }
  }

  nodes.forEach(traverse)
  return paths
}

/**
 * 高亮匹配的文本
 * @param text - 原始文本
 * @param query - 搜索关键词
 * @param caseSensitive - 是否区分大小写
 * @returns 高亮后的 HTML
 */
function highlightMatch(text: string, query: string, caseSensitive: boolean): string {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(`(${escapedQuery})`, flags)

  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

/**
 * 在单个文件中搜索
 * @param filePath - 文件路径
 * @param query - 搜索关键词
 * @param options - 搜索选项
 * @returns 搜索结果数组
 */
async function searchInFile(
  filePath: string,
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  try {
    const content = await readFile(filePath)
    const lines = content.split('\n')
    const results: SearchResult[] = []
    const { caseSensitive = false, maxResults = 100 } = options

    let searchRegex: RegExp

    // 创建搜索正则
    if (options.useRegex) {
      try {
        searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi')
      } catch {
        // 正则表达式无效，回退到普通搜索
        searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi')
      }
    } else {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      searchRegex = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi')
    }

    // 逐行搜索
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      let match: RegExpExecArray | null

      // 重置正则表达式的 lastIndex
      searchRegex.lastIndex = 0

      while ((match = searchRegex.exec(line)) !== null) {
        results.push({
          path: filePath,
          fileName: filePath.split(/[/\\]/).at(-1) ?? filePath,
          line: i + 1,
          content: line.trim(),
          match: match[0],
          matchStart: match.index,
          matchEnd: match.index + match[0].length,
        })

        // 达到最大结果数时停止
        if (results.length >= maxResults) {
          return results
        }
      }
    }

    return results
  } catch {
    // 文件读取失败，返回空结果
    return []
  }
}

/**
 * 在工作区中搜索
 * @param nodes - 文件树节点
 * @param query - 搜索关键词
 * @param options - 搜索选项
 * @returns 搜索结果汇总数组
 */
export async function searchInWorkspace(
  nodes: FileNode[],
  query: string,
  options: SearchOptions = {},
): Promise<SearchResultSummary[]> {
  // 空查询返回空结果
  if (!query.trim()) {
    return []
  }

  const filePaths = getAllMarkdownFilePaths(nodes)
  const maxFilesToSearch = 50 // 限制搜索的文件数量，防止卡顿
  const filesToSearch = filePaths.slice(0, maxFilesToSearch)

  // 并发搜索所有文件
  const searchResults = await Promise.all(
    filesToSearch.map(async (filePath) => {
      const results = await searchInFile(filePath, query, options)
      return {
        path: filePath,
        fileName: filePath.split(/[/\\]/).at(-1) ?? filePath,
        count: results.length,
        results,
      }
    }),
  )

  // 过滤掉没有结果的文件
  return searchResults.filter((result) => result.count > 0)
}

/**
 * 获取搜索结果的统计信息
 * @param results - 搜索结果汇总数组
 * @returns 统计信息对象
 */
export function getSearchStats(results: SearchResultSummary[]): {
  totalFiles: number
  totalMatches: number
} {
  const totalFiles = results.length
  const totalMatches = results.reduce((sum, result) => sum + result.count, 0)

  return { totalFiles, totalMatches }
}

/**
 * 格式化搜索结果显示
 * @param result - 搜索结果
 * @param query - 搜索关键词
 * @param caseSensitive - 是否区分大小写
 * @returns 高亮后的 HTML 字符串
 */
export function formatSearchResult(
  result: SearchResult,
  query: string,
  caseSensitive: boolean,
): string {
  return highlightMatch(result.content, query, caseSensitive)
}
