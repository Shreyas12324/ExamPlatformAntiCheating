#!/usr/bin/env node

/**
 * React Frontend - Pre-flight Check
 * Verifies all components are ready before starting dev server
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log('\n🚀 Interview Practice Partner - Pre-flight Check\n');

const checks = [
  {
    name: 'Package dependencies',
    check: () => fs.existsSync('package.json'),
    fix: 'Run: npm install'
  },
  {
    name: 'Node modules installed',
    check: () => fs.existsSync('node_modules'),
    fix: 'Run: npm install'
  },
  {
    name: 'Environment file',
    check: () => fs.existsSync('.env'),
    fix: 'Run: copy .env.example .env'
  },
  {
    name: 'Source directory',
    check: () => fs.existsSync('src'),
    fix: 'Source directory missing'
  },
  {
    name: 'App.jsx',
    check: () => fs.existsSync('src/App.jsx'),
    fix: 'App.jsx missing'
  },
  {
    name: 'main.jsx',
    check: () => fs.existsSync('src/main.jsx'),
    fix: 'main.jsx missing'
  },
  {
    name: 'Pages directory',
    check: () => {
      return fs.existsSync('src/pages/Home.jsx') &&
             fs.existsSync('src/pages/Interview.jsx') &&
             fs.existsSync('src/pages/Feedback.jsx');
    },
    fix: 'Missing page components'
  },
  {
    name: 'Components directory',
    check: () => {
      const components = [
        'ChatBubble.jsx',
        'ChatInput.jsx',
        'Header.jsx',
        'Sidebar.jsx',
        'VoicePlayer.jsx',
        'VoiceRecorder.jsx',
        'WebcamFeed.jsx'
      ];
      return components.every(c => fs.existsSync(`src/components/${c}`));
    },
    fix: 'Missing component files'
  },
  {
    name: 'Services',
    check: () => {
      return fs.existsSync('src/services/api.js') &&
             fs.existsSync('src/services/voice.js');
    },
    fix: 'Missing service files'
  },
  {
    name: 'Custom hooks',
    check: () => {
      return fs.existsSync('src/hooks/useInterview.js') &&
             fs.existsSync('src/hooks/useWebcam.js') &&
             fs.existsSync('src/hooks/useVoice.js');
    },
    fix: 'Missing custom hooks'
  },
  {
    name: 'Context provider',
    check: () => fs.existsSync('src/context/InterviewContext.jsx'),
    fix: 'Missing InterviewContext.jsx'
  },
  {
    name: 'Tailwind CSS',
    check: () => fs.existsSync('tailwind.config.js'),
    fix: 'Missing tailwind.config.js'
  },
  {
    name: 'Vite config',
    check: () => fs.existsSync('vite.config.js'),
    fix: 'Missing vite.config.js'
  }
];

let passed = 0;
let failed = 0;

checks.forEach((test) => {
  try {
    if (test.check()) {
      console.log(`${GREEN}✓${RESET} ${test.name}`);
      passed++;
    } else {
      console.log(`${RED}✗${RESET} ${test.name}`);
      console.log(`  ${YELLOW}→${RESET} ${test.fix}`);
      failed++;
    }
  } catch (error) {
    console.log(`${RED}✗${RESET} ${test.name}`);
    console.log(`  ${YELLOW}→${RESET} ${test.fix}`);
    failed++;
  }
});

console.log(`\n${GREEN}Passed: ${passed}${RESET} | ${RED}Failed: ${failed}${RESET}\n`);

if (failed === 0) {
  console.log(`${GREEN}✓ All checks passed! Ready to start development server.${RESET}`);
  console.log(`\nRun: ${YELLOW}npm run dev${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}✗ Some checks failed. Please fix the issues above.${RESET}\n`);
  process.exit(1);
}
