// navLanguage copyright 2023 Paul Beaudet MIT License
import type { navItems } from '../../shared/interface';

const learnLinks: navItems[] = [
  {
    type: 'link',
    link: 'https://deabute.com/products/plan/',
    text: 'Budgeting',
    icon: 'InfoCircle',
  },
];

const supportLinks: navItems[] = [
  {
    type: 'button',
    link: 'showDonate',
    text: 'Donate',
    icon: 'CurrencyDollar',
  },
  {
    type: 'link',
    link: 'https://deabute.com/plan-get-involved/',
    text: 'Contribute',
    icon: 'InfoCircle',
  },
  {
    type: 'link',
    link: 'https://github.com/Deabute/plan-client',
    text: 'Source',
    icon: 'GitHub',
  },
];

export { learnLinks, supportLinks };
