import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'zh-CN',
  title: '苏格拉底儿',
  description: '破茧成蝶，羽化成仙',
  head: [
    ['script', { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=UA-201208347-1' }],
    ['script', {}, `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-201208347-1');
    `]
  ],
  public: 'public',
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
