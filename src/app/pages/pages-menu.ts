import { MenuItem } from './menu-item';

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'SERVICES',
    group: true,
    key: 'SERVICES',
  },
  {
    title: 'Home',
    icon: 'home-outline',
    link: "/pages/home",
    data: {
      name: "home"
    },
    key: 'Home'
  },
  {
    title: 'Data Catalogue',
    icon: 'search-outline',
    link: '/pages/datasets',
    data: {
      name: 'catalogues',
    },
    hidden: false,
    key: 'Data Catalogue'
  },
  {
    title: 'Catalogues',
    icon: 'list-outline',
    link: '/pages/catalogues',
    data: {
      name: 'catalogues',
    },
    hidden: false,
    key: 'Catalogues'
  },
  {
    title: 'Statistics',
    icon: 'pie-chart-outline',
    link: '/pages/statistics',
    data: {
      name: 'statistics',
    },
    hidden: false,
    key: 'Statistics'
  },
  {
    title: 'Mqa Scoring',
    icon: 'bar-chart-outline',
    link: '/pages/mqa',
    data: {
      name: 'mqa',
    },
    hidden: true,
    key: 'Mqa Scoring'
  },
  {
    title: 'Sparql',
    icon: 'code-outline',
    link: "/pages/sparql",
    data: {
      name: "sparql"
    },
    key: 'Sparql'
  },
  {
    title: 'Datasets NGSI',
    icon: 'folder-outline',
    link: "/pages/datasets-ngsi",
    data: {
      name: "datasets-ngsi"
    },
    key: 'Datasets NGSI'
  },
  {
    title: 'Models and Tools',
    icon: 'pantone-outline',
    link: "/pages/models-tools",
    data: {
      name: "models-tools"
    },
    key: 'Models and Tools'
  },
  {
    title: 'Administration',
    icon: 'settings-2-outline',
    children: [
      {
        title: 'Data Catalogue Administration',
        link: '/pages/administration/adminCatalogues',
        key: 'Data Catalogue Administration'
      },
      {
        title: 'Datalet Administration',
        link: '/pages/administration/dataletsManagement',
        key: 'Datalet Administration'
      },
      {
        title: 'Configurations Administration',
        link: '/pages/administration/configuration',
        key: 'Configurations Administration'
      },
    ],
    data: {
      name: 'administration',
    },
    hidden: true,
    key: 'Administration'
  },
];
