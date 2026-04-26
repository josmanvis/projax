import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'PROJAX',
  tagline: 'Cross-platform project management dashboard for tracking local development projects',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://projax.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployments, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'josmanvis',
  projectName: 'projax',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/josmanvis/projax/tree/main/packages/docsite/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/projax-social-card.jpg',
    navbar: {
      title: 'PROJAX',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'gettingStarted',
          position: 'left',
          label: 'Getting Started',
        },
        {
          type: 'docSidebar',
          sidebarId: 'cli',
          position: 'left',
          label: 'CLI',
        },
        {
          type: 'docSidebar',
          sidebarId: 'api',
          position: 'left',
          label: 'API',
        },
        {
          type: 'docSidebar',
          sidebarId: 'core',
          position: 'left',
          label: 'Core',
        },
        {
          type: 'docSidebar',
          sidebarId: 'desktop',
          position: 'left',
          label: 'Desktop',
        },
        {
          type: 'docSidebar',
          sidebarId: 'editors',
          position: 'left',
          label: 'Editors',
        },
        {
          type: 'docSidebar',
          sidebarId: 'examples',
          position: 'left',
          label: 'Examples',
        },
        {
          type: 'docSidebar',
          sidebarId: 'troubleshooting',
          position: 'left',
          label: 'Troubleshooting',
        },
        {
          href: 'https://www.npmjs.com/package/projax',
          label: 'npm',
          position: 'right',
          className: 'header-version-badge',
        },
        {
          href: 'https://github.com/josmanvis/projax',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/projax',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/introduction',
            },
            {
              label: 'CLI',
              to: '/docs/cli/overview',
            },
            {
              label: 'API',
              to: '/docs/api/overview',
            },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: 'Core',
              to: '/docs/core/overview',
            },
            {
              label: 'Desktop',
              to: '/docs/desktop/overview',
            },
            {
              label: 'Prxi',
              to: '/docs/prxi/overview',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Examples',
              to: '/docs/examples/basic-workflow',
            },
            {
              label: 'Troubleshooting',
              to: '/docs/troubleshooting/port-conflicts',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/josmanvis/projax',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/projax',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} PROJAX · from <a href="https://github.com/josmanvis" target="_blank" rel="noopener noreferrer">Jose</a> with love`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

