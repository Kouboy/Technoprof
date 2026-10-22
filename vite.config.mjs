import { defineConfig } from 'vite';
import catalog from './tools/asset-catalog.cjs';

export default defineConfig(({ mode }) => ({
  define: { __TECHNOPROF_DAY__: JSON.stringify(mode === 'day') },
  plugins: mode === 'day' ? [{
    name: 'technoprof-day-assets',
    enforce: 'pre',
    transformIndexHtml(html) { return catalog.dayDocument(html); },
    transform(source, id) {
      const code = catalog.selectDayAssets(id, source);
      return code === null ? null : { code, map: null };
    },
  }] : [],
}));
