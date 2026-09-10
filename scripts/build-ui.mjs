import esbuild from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
await esbuild.build({entryPoints:['src/main.jsx'],bundle:true,minify:true,sourcemap:false,format:'iife',outfile:'assets/app.js',loader:{'.jsx':'jsx'},jsx:'automatic'});
await esbuild.build({entryPoints:['src/app.css'],bundle:true,minify:true,outfile:'assets/app.css'});
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#F6F7F8"><title>韩语词场</title><meta name="description" content="韩语词汇学习与间隔复习"><link rel="icon" href="favicon.svg"><link rel="stylesheet" href="assets/app.css"></head><body><div id="root"></div><script src="assets/app.js" defer></script></body></html>`;
await writeFile('index.html',html);
console.log('Built D2 UI');
