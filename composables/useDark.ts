import { useDark as _useDark } from '@vueuse/core'

const dark = _useDark({
	selector: 'body',
	attribute: 'data-theme',
	valueDark: 'dark',
	valueLight: 'light',
})

export function useDark() {
	return dark
}
