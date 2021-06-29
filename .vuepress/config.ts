import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'zh-CN',
  title: '苏格拉底儿',
  description: '破茧成蝶，羽化成仙',

  themeConfig: {
    darkMode: true,
    sidebar: 'auto',

    navbar: [
      {
        text: 'Windows',
        children: [
          {
            text: 'DuiLib 源码剖析',
            link: '/windows/duiLib-source-code-analysis.md'
          }
        ],
      }
    ]
  }
})
