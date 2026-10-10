import os,json,subprocess,datetime,hashlib,re
from pathlib import Path
root=Path.cwd(); out=root/'aidlc/spaces/default/intents/261008-formicarium-integration-2/construction/build-and-test/verification'; package=root/'packages/terrarium'; env=os.environ.copy();env['FORMICARIUM_INPUTS_ROOT']=str(root/'.vendor/formicarium-inputs-integration-2');env['TERRARIUM_VERSION']='integration2-bt-20261008'; records=[]
def run(name,command,cwd=root,extra=None):
 e=env.copy();e.update(extra or {});start=datetime.datetime.now(datetime.timezone.utc).isoformat();log=out/(name+'.log')
 with log.open('w') as f:result=subprocess.run(command,cwd=cwd,env=e,stdout=f,stderr=subprocess.STDOUT)
 row={'name':name,'command':command,'cwd':str(cwd),'started':start,'finished':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exit':result.returncode,'log':log.name,'logSha256':hashlib.sha256(log.read_bytes()).hexdigest()};records.append(row);(out/'checks.json').write_text(json.dumps(records,indent=2)+'\n');print(name,result.returncode,flush=True);return result.returncode
instructions=(root/'aidlc/spaces/default/intents/261008-formicarium-integration-2/construction/code-generation/unit-test-instructions.md').read_text();commands=[]
for block in re.findall(r'```sh\n(.*?)```',instructions,re.S):
 for command in block.strip().splitlines():
  if command not in commands:commands.append(command)
for i,cmd in enumerate(commands):run('targeted-'+str(i+1),['/bin/bash','-c',cmd])
run('lint',['mise','run','lint:all'])
for name in ['typecheck','test','build']:run(name,['mise','exec','--','bun','run',name],package)
for mode in ['formicarium','legacy']:run('assembly-'+mode,['mise','exec','--','bash','scripts/assemble-pages.sh','.vendor/site-'+mode+'-integration-2-bt']+(['legacy'] if mode=='legacy' else []))
bun=subprocess.check_output(['mise','which','bun'],text=True).strip()
for mode in ['formicarium','legacy']:
 config='playwright.formicarium.config.ts' if mode=='formicarium' else 'playwright.config.ts'
 run('browser-'+mode,['mise','exec','--','bun','x','playwright','test','--config',config,'--workers=1','--retries=0','--reporter=json','--output',str(out/(mode+'-results'))],package,{'CI':'1','TERRARIUM_BUN':bun,'TERRARIUM_SITE_DIR':str(root/('.vendor/site-'+mode+'-integration-2-bt'))})
print('DONE',flush=True)
