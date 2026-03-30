import { describe, expect, it } from 'vitest'
import { cn } from '@/utils/cn'

describe('cn 工具函数 - 完整测试套件', () => {
  describe('基础功能', () => {
    it('合并多个类名', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3')
    })

    it('处理单个类名', () => {
      expect(cn('single-class')).toBe('single-class')
    })

    it('处理空字符串', () => {
      expect(cn('')).toBe('')
    })

    it('处理无参数', () => {
      expect(cn()).toBe('')
    })
  })

  describe('条件类名', () => {
    it('包含 true 条件的类名', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional')
    })

    it('排除 false 条件的类名', () => {
      expect(cn('base', false && 'conditional')).toBe('base')
    })

    it('处理多个条件', () => {
      expect(
        cn(
          'base',
          true && 'yes',
          false && 'no',
          true && 'also-yes'
        )
      ).toBe('base yes also-yes')
    })

    it('处理 null 和 undefined', () => {
      expect(cn('base', null && 'null-class', undefined && 'undefined-class')).toBe('base')
    })

    it('处理 0 和 falsy 数值', () => {
      expect(cn('base', 0 && 'zero', 1 && 'one')).toBe('base one')
    })
  })

  describe('Tailwind 冲突处理', () => {
    it('后置类名覆盖前置类名', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('处理多个相同类型的类名', () => {
      expect(cn('p-2', 'p-4', 'p-8')).toBe('p-8')
    })

    it('处理不同类型的类名（保留）', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('处理复杂的 Tailwind 组合', () => {
      expect(cn('hover:text-red-500', 'hover:text-blue-500')).toBe('hover:text-blue-500')
    })

    it('处理响应式变体', () => {
      expect(cn('md:text-red-500', 'md:text-blue-500')).toBe('md:text-blue-500')
    })

    it('处理暗色模式变体', () => {
      expect(cn('dark:text-red-500', 'dark:text-blue-500')).toBe('dark:text-blue-500')
    })
  })

  describe('数组输入', () => {
    it('处理数组类名', () => {
      expect(cn(['class1', 'class2', 'class3'])).toBe('class1 class2 class3')
    })

    it('处理嵌套数组', () => {
      expect(cn(['class1', ['class2', ['class3']]])).toBe('class1 class2 class3')
    })

    it('处理混合数组和字符串', () => {
      expect(cn('class1', ['class2', 'class3'], 'class4')).toBe('class1 class2 class3 class4')
    })

    it('处理空数组', () => {
      expect(cn([])).toBe('')
    })

    it('处理包含条件的数组', () => {
      expect(cn(['class1', false && 'class2', 'class3'])).toBe('class1 class3')
    })
  })

  describe('对象输入', () => {
    it('处理对象键值对', () => {
      expect(cn({ 'class1': true, 'class2': false, 'class3': true })).toBe('class1 class3')
    })

    it('处理混合对象和字符串', () => {
      expect(cn('class1', { 'class2': true, 'class3': false })).toBe('class1 class2')
    })

    it('处理嵌套对象', () => {
      expect(cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'p-4': true,
      })).toBe('text-red-500 p-4')
    })

    it('处理空对象', () => {
      expect(cn({})).toBe('')
    })
  })

  describe('边界条件', () => {
    it('处理重复类名（去重）', () => {
      expect(cn('class1', 'class1', 'class1')).toBe('class1')
    })

    it('处理包含空格的类名', () => {
      expect(cn('class1 class2', 'class3')).toBe('class1 class2 class3')
    })

    it('处理前导和尾随空格', () => {
      expect(cn('  class1  ', '  class2  ')).toBe('class1 class2')
    })

    it('处理多余空格', () => {
      expect(cn('class1   class2', 'class3')).toBe('class1 class2 class3')
    })

    it('处理特殊字符类名', () => {
      expect(cn('class-1', 'class_2', 'class@3', 'class$4')).toBe('class-1 class_2 class@3 class$4')
    })

    it('处理 Unicode 类名', () => {
      expect(cn('类名1', '类名2', 'класс3')).toBe('类名1 类名2 класс3')
    })

    it('处理超长类名', () => {
      const longClass = 'a'.repeat(1000)
      expect(cn(longClass)).toBe(longClass)
    })
  })

  describe('实际使用场景', () => {
    it('按钮组件样式组合', () => {
      const base = 'px-4 py-2 rounded-md font-medium transition-colors'
      const variant = 'bg-blue-500 text-white hover:bg-blue-600'
      const size = 'text-lg'
      const disabled = 'opacity-50 cursor-not-allowed'

      expect(cn(base, variant, size, disabled)).toBe(
        'px-4 py-2 rounded-md font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600 text-lg opacity-50 cursor-not-allowed'
      )
    })

    it('条件样式切换', () => {
      const isActive = true
      const isDisabled = false

      expect(
        cn(
          'base-class',
          isActive && 'active-class',
          isDisabled && 'disabled-class'
        )
      ).toBe('base-class active-class')
    })

    it('动态样式覆盖', () => {
      expect(cn('text-sm', 'text-base', 'text-lg')).toBe('text-lg')
    })

    it('组合多个变体', () => {
      const variants = {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-500 text-white',
        danger: 'bg-red-500 text-white',
      }

      expect(cn('px-4 py-2 rounded', variants.primary)).toBe(
        'px-4 py-2 rounded bg-blue-500 text-white'
      )
    })
  })

  describe('性能测试', () => {
    it('快速处理大量类名', () => {
      const classes = Array.from({ length: 1000 }, (_, i) => `class-${i}`)

      const start = performance.now()
      const result = cn(...classes)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10) // 10ms 内完成
      expect(result.split(' ')).toHaveLength(1000)
    })

    it('快速处理复杂条件', () => {
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        cn('base', i % 2 === 0 && 'even', i % 3 === 0 && 'triple')
      }
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // 50ms 内完成 1000 次调用
    })
  })

  describe('与 clsx 的兼容性', () => {
    it('兼容 clsx 的参数格式', () => {
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz')
    })

    it('处理 clsx 风格的对象', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('处理 clsx 风格的数组', () => {
      expect(cn(['foo', 0, false, 'baz'])).toBe('foo baz')
    })
  })

  describe('Tailwind 特定场景', () => {
    it('正确处理任意值', () => {
      expect(cn('text-[14px]', 'text-[16px]')).toBe('text-[16px]')
    })

    it('正确处理重要标记', () => {
      expect(cn('text-red-500', '!text-blue-500')).toBe('text-red-500 !text-blue-500')
    })

    it('处理状态前缀', () => {
      expect(cn('focus:text-red-500', 'hover:text-blue-500', 'active:text-green-500')).toBe(
        'focus:text-red-500 hover:text-blue-500 active:text-green-500'
      )
    })

    it('处理组合类名', () => {
      expect(cn('group-hover:text-red-500', 'peer-focus:text-blue-500')).toBe(
        'group-hover:text-red-500 peer-focus:text-blue-500'
      )
    })
  })
})
