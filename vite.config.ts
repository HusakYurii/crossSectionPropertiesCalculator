import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import { katex } from '@mdit/plugin-katex'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    // .md files are compiled into Vue components; $...$ / $$...$$ math is rendered by KaTeX
    Markdown({
      wrapperClasses: 'markdown-body',
      markdownSetup(md) {
        // markdown-exit is runtime-compatible with markdown-it plugins, but its types differ
        md.use(katex as never, {
          // KaTeX keeps the TeX source in the markup; v-pre stops Vue reading {{ }} in it as interpolation
          transformer: (html: string) => html.replace(/^<(\w+)/, '<$1 v-pre'),
        })
      },
    }),
  ],
})
