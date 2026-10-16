// Dependency-free formatting using the project's existing TypeScript printer.
import ts from 'typescript';
import {transform} from 'esbuild';
import {readFile,writeFile,readdir} from 'node:fs/promises';
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
for(const dir of ['src','tests','scripts']) for(const file of await readdir(dir)) {
 if(!/\.(tsx?|mjs)$/.test(file)||file==='format-source.mjs')continue;
 const path=`${dir}/${file}`,source=await readFile(path,'utf8');
 const kind=file.endsWith('.tsx')?ts.ScriptKind.TSX:file.endsWith('.mjs')?ts.ScriptKind.JS:ts.ScriptKind.TS;
 await writeFile(path,printer.printFile(ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,kind)));
}
const css=await readFile('src/style.css','utf8');
await writeFile('src/style.css',(await transform(css,{loader:'css',minify:false})).code);
