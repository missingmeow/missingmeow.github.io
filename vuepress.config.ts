import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'zh-CN',
  title: '苏格拉底儿',
  description: '破茧成蝶，羽化成仙。',
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
        text: 'Tec',
        children: [
          {
            text: 'C++',
            children: [
              '/posts/cpp-base.md',
              '/posts/cpp-modern.md',
              '/posts/cpp-ucontext.md'
            ]
          },
          {
            text: 'Windows',
            children: [
              '/posts/duilib-source-code-analysis.md'
            ],
          }
        ]
      },
      {
        text: 'Other',
        children: [
          '/posts/interview.md'
        ],
      }
    ]
  }
})
