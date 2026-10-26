const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let count=0,jsons=0;
function visit(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())visit(p);else if(/\.(c?js)$/.test(f.name)){cp.execFileSync(process.execPath,['--check',p],{stdio:'pipe'});count++;}else if(f.name.endsWith('.json')){JSON.parse(fs.readFileSync(p,'utf8'));jsons++;}}}
visit(root);
const cfg=JSON.parse(fs.readFileSync(path.join(root,'miniprogram/app.json'),'utf8'));
for(const p of cfg.pages)for(const ext of ['.js','.json','.wxml','.wxss'])a.ok(fs.existsSync(path.join(root,'miniprogram',p+ext)),p+ext);
a.equal(fs.readFileSync(path.join(root,'miniprogram/shared/core.js'),'utf8'),fs.readFileSync(path.join(root,'cloudfunctions/campusApi/core.js'),'utf8'),'共享规则副本不同步');
const modes=JSON.parse(fs.readFileSync(path.join(root,'cloudfunctions/database.rules.json'),'utf8'));a.equal(modes.read,false);a.equal(modes.write,false);
const storage=JSON.parse(fs.readFileSync(path.join(root,'cloudfunctions/storage.rules.json'),'utf8'));a.equal(storage.read,false);a.ok(storage.write.includes('auth.openid != null'));a.ok(storage.write.includes('/^reviews\\//.test(resource.path)'));a.ok(!storage.write.includes('verified'));
console.log(`PASS: ${count} JavaScript files syntax; ${jsons} JSON files; ${cfg.pages.length} native page routes; shared core parity; deny-all database rules; private storage rule template.`);
