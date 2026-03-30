import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'

export function createSaveKeymap(onSave: () => void) {
  return Prec.high(
    keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSave()
          return true
        },
      },
    ]),
  )
}
