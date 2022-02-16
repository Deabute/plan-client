// navLanguage copyright 2023 Paul Beaudet MIT License
import type { navItems } from '../../shared/interface';

const learnLinks: navItems[] = [
  {
    type: 'link',
    link: 'https://deabute.com/products/plan/',
    text: 'Why Budget Time?',
    icon: 'InfoCircle',
  },
  {
    type: 'link',
    link: 'mailto: paul@deabute.com',
    text: 'paul@deabute.com',
    icon: 'Envelope',
  },
  {
    type: 'link',
    link: 'https://deabute.com/plan-privacy-policy/',
    text: 'Privacy Policy',
    icon: 'InfoCircle',
  },
];

const supportLinks: navItems[] = [
  {
    type: 'link',
    link: 'https://deabute.com/deabute-plan/',
    text: 'About',
    icon: 'InfoCircle',
  },
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
