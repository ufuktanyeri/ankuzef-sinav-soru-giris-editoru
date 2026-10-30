import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  publicDir: 'public',
  manifest: {
    name: 'ANKUZEF Soru Aktarıcı',
    short_name: 'ANKUZEF Aktarıcı',
    description:
      'JSON soru havuzlarını ankuzefsinav.ankara.edu.tr soru bankasına taslak olarak aktarır.',
    permissions: ['storage', 'activeTab'],
    host_permissions: [
      'https://ankuzefsinav.ankara.edu.tr/*',
      'https://ankuzefsinavapi.ankara.edu.tr/*',
    ],
    action: { default_title: 'ANKUZEF Soru Aktarıcı' },
  },
  webExt: {
    startUrls: ['https://ankuzefsinav.ankara.edu.tr/authorquestion/assignments'],
  },
});
