// @ts-check

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Symbol Community Documents",
  tagline: "Empowering People with Blockchain",
  favicon: "img/favicon.ico",
  url: "https://docs.symbol-community.com",
  baseUrl: "/",
  trailingSlash: false,
  organizationName: "ymuichiro",
  projectName: "symbol-community-documents",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja", "it", "zh", "zh-hant-tw"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          routeBasePath: "/",
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        gtag: {
          trackingID: "G-NJSWS5V0XT",
          anonymizeIP: true,
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/twitter-card.png",
      navbar: {
        title: "Symbol Community Documents",
        hideOnScroll: false,
        logo: {
          alt: "symbol logo",
          src: "img/logo.webp",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "symbol_sdk",
            position: "left",
            label: "symbol-sdk",
          },
          {
            type: "docSidebar",
            sidebarId: "node",
            position: "left",
            label: "node",
          },
          {
            type: "localeDropdown",
            position: "right",
          },
          {
            href: "https://github.com/ymuichiro/symbol-community-documents",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.gg/xymcity",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/symnem_com_info",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Community Site",
                href: "https://symbol-community.com",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Symbol Community.`,
      },
      colorMode: {
        defaultMode: "dark",
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
