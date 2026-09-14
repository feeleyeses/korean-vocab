export function verifyPhase(phase,currentHash,manifest){
 if(!['pre_publish','post_publish'].includes(phase))throw Error('Explicit publication phase required');
 if(manifest.previousVocabularyHash===manifest.newVocabularyHash)throw Error('Release must change vocabulary hash');
 if(phase==='pre_publish'){
  if(currentHash===manifest.newVocabularyHash)return {status:'already_published',writerAllowed:false};
  if(currentHash!==manifest.previousVocabularyHash)throw Error('Production drift');
  return {status:'ready',writerAllowed:true};
 }
 if(currentHash!==manifest.newVocabularyHash)throw Error('Post-release drift');
 return {status:'published',writerAllowed:false};
}
