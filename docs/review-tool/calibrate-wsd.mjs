import fs from 'node:fs/promises';
const file=new URL('./bge-report.json',import.meta.url),report=JSON.parse(await fs.readFile(file,'utf8'));
if(report.status!=='available')throw Error('BGE unavailable, metrics must remain null');
// Frozen encoder; calibration fold only. No threshold is enabled without same-headword negatives.
const curve=[];
for(const semantic of [.80,.85,.90,.95])for(const margin of [.12,.15,.20]){
 const rows=report.rows.filter(r=>r.split==='calibration'&&r.randomOtherGlossTop!==null);
 const accepted=rows.filter(r=>Math.max(r.topSenseScore,r.randomOtherGlossTop)>=semantic&&Math.abs(r.diagnosticMargin)>=margin);
 curve.push({semantic,margin,accepted:accepted.length,precisionProxy:accepted.length?accepted.filter(r=>r.diagnosticTop1Correct).length/accepted.length:null});
}
const test=report.rows.filter(r=>r.split==='test'),provisional=test.filter(r=>Math.max(r.topSenseScore,r.randomOtherGlossTop??-1)>=.8&&Math.abs(r.diagnosticMargin??0)>=.12);
report.calibration={fold:'calibration',curve,chosenSemantic:null,chosenMargin:null,sameHeadwordNegativeCount:report.rows.reduce((n,r)=>n+r.sameWordHardNegatives,0),activated:false,reason:'No same-headword sense alternatives in fixed set; random-other-gloss diagnostics cannot certify WSD.'};
report.testProvisionalDiagnostic={semantic:.8,margin:.12,accepted:provisional.length,precisionProxy:provisional.length?provisional.filter(r=>r.diagnosticTop1Correct).length/provisional.length:null};
await fs.writeFile(file,JSON.stringify(report,null,2));
console.log(JSON.stringify({stats:report.stats,calibrationMaxAccepted:Math.max(...curve.map(c=>c.accepted)),testProvisional:report.testProvisionalDiagnostic,wsdCalibrated:false}));
