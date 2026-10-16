import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('lib', { recursive: true });
await build({ entryPoints: ['src/index.ts'], outfile: 'lib/index.js', bundle: true, platform: 'node', format: 'esm', target: 'node20', sourcemap: true });
const client = await build({ entryPoints: ['src/client.tsx'], bundle: true, write: false, platform: 'browser', format: 'cjs', target: 'chrome120', external: ['react', 'react-dom', 'react/jsx-runtime'], loader: { '.css': 'text' }, minify: true });
await writeFile('lib/client.js', `window.__ModuleLoader__.load({id:"dsh-mini-usage",factory:(require)=>{var module={exports:{}};var exports=module.exports;\n${client.outputFiles[0].text}\nreturn module.exports;}});\n`);
console.log('Built host ESM and DSH client module.');
