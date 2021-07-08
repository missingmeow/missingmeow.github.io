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
        text: 'Language',
        children: [
          {
            text: 'C++',
            children: [
              {
                text: '11/14/17/20',
                link: '/posts/c-plus-plus-11-14-17-20.md'
              }
            ]
          }
        ]
      },
      {
        text: 'Windows',
        children: [
          {
            text: 'DuiLib 源码剖析',
            link: '/posts/duilib-source-code-analysis.md'
          }
        ],
      }
    ]
  }
})
