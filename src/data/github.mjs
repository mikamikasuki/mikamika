import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import calculateRank from '../../vendor/calculateRank.js';
export const dateInZone=(date,zone)=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const prev=day=>new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
export function streakFromDays(days,today){
 const counts=new Map(days.map(d=>[d.date,d.contributionCount]));let end=counts.get(today)>0?today:prev(today),start=end,n=0;
 while(counts.get(start)>0){n++;start=prev(start);}return {count:n,start:n?new Date(Date.parse(start+'T12:00:00Z')+86400000).toISOString().slice(0,10):null,end:n?end:null};
}
export function emptyStats(){return {status:'unavailable',source:'GitHub GraphQL API',fetched_at:null,stars:null,commits:null,prs:null,issues:null,contributed:null,total:null,created_at:null,rank:null,streak:null};}
export async function graphql(query,variables,{token,fetcher=fetch}={}){
 if(!token)throw new Error('No GitHub data credential');
 for(let attempt=0;attempt<3;attempt++){
  let r;try{r=await fetcher('https://api.github.com/graphql',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(20000)});}catch{if(attempt===2)throw new Error('GitHub request timed out');continue;}
  if([429,502,503,504].includes(r.status)&&attempt<2){await new Promise(r=>setTimeout(r,500*(attempt+1)));continue;}
  if(!r.ok)throw new Error(`GitHub request failed (${r.status})`);
  const body=await r.json();if(body.errors?.length||!body.data?.user)throw new Error('GitHub returned an incomplete response');
  if(body.data.rateLimit?.remaining===0)throw new Error('GitHub rate limit exhausted');return body.data;
 }
 throw new Error('GitHub request failed');
}
const baseQuery=`query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){createdAt followers{totalCount} pullRequests{totalCount} openIssues:issues(states:OPEN){totalCount} closedIssues:issues(states:CLOSED){totalCount} repositoriesContributedTo(contributionTypes:[COMMIT,ISSUE,PULL_REQUEST,REPOSITORY]){totalCount} contributionsCollection(from:$from,to:$to){totalCommitContributions totalPullRequestReviewContributions} repositories(first:100,ownerAffiliations:OWNER){nodes{stargazerCount} pageInfo{hasNextPage endCursor}}} rateLimit{remaining}}`;
const repoQuery=`query($login:String!,$after:String!){user(login:$login){repositories(first:100,ownerAffiliations:OWNER,after:$after){nodes{stargazerCount} pageInfo{hasNextPage endCursor}}} rateLimit{remaining}}`;
const calendarQuery=`query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}} rateLimit{remaining}}`;
const count=n=>{if(!Number.isInteger(n)||n<0)throw new Error('GitHub count missing');return n;};
export async function fetchStats(profile,{token,now=new Date(),cache='.cache/stats',fetcher=fetch}={}){
 await fs.mkdir(cache,{recursive:true});const snapshot=path.join(cache,`${profile.username}-last-good.json`);
 let last=null;try{last=JSON.parse(await fs.readFile(snapshot));}catch{try{last=JSON.parse(await fs.readFile('assets/generated/stats.json'));}catch{}}
 if(last?.username!==profile.username)last=null;
 try{
  const to=now.toISOString(),fromDate=new Date(now);fromDate.setUTCFullYear(fromDate.getUTCFullYear()-1);const from=fromDate.toISOString();
  const request=(q,v)=>graphql(q,{login:profile.username,...v},{token,fetcher});
  const {user:u}=await request(baseQuery,{from,to});
  let repos=u.repositories,stars=0,seen=new Set();
  for(let page=0;;page++){
   stars+=repos.nodes.reduce((a,r)=>a+count(r.stargazerCount),0);
   if(!repos.pageInfo.hasNextPage)break;
   const cursor=repos.pageInfo.endCursor;if(!cursor||seen.has(cursor)||page>=100)throw new Error('GitHub pagination incomplete');seen.add(cursor);
   repos=(await request(repoQuery,{after:cursor})).user.repositories;
  }
  const created=new Date(u.createdAt);if(Number.isNaN(created.valueOf()))throw new Error('Account creation date unavailable');
  const days=new Map();
  for(let year=created.getUTCFullYear();year<=now.getUTCFullYear();year++){
   const filename=path.join(cache,`${profile.username}-${year}.json`);let record;
   try{record=JSON.parse(await fs.readFile(filename));}catch{}
   const current=year===now.getUTCFullYear();
   if(!record||current||now-new Date(record.fetched_at)>30*86400000){
    const start=year===created.getUTCFullYear()?created.toISOString():`${year}-01-01T00:00:00Z`,end=current?to:`${year}-12-31T23:59:59Z`;
    const data=await request(calendarQuery,{from:start,to:end});const weeks=data.user.contributionsCollection.contributionCalendar.weeks;
    if(!Array.isArray(weeks)||!weeks.length)throw new Error('Contribution calendar incomplete');
    record={fetched_at:to,year,days:weeks.flatMap(w=>w.contributionDays).map(d=>({date:d.date,contributionCount:count(d.contributionCount)}))};
    const expected=Math.floor((Date.parse(end.slice(0,10)+'T12:00:00Z')-Date.parse(start.slice(0,10)+'T12:00:00Z'))/86400000)+1;
    if(new Set(record.days.map(d=>d.date)).size<expected)throw new Error('Contribution calendar truncated');
    await fs.writeFile(filename,JSON.stringify(record));
   }
   for(const d of record.days)if(d.date>=u.createdAt.slice(0,10)&&d.date<=to.slice(0,10))days.set(d.date,d);
  }
  const commits=count(u.contributionsCollection.totalCommitContributions),prs=count(u.pullRequests.totalCount),issues=count(u.openIssues.totalCount)+count(u.closedIssues.totalCount),reviews=count(u.contributionsCollection.totalPullRequestReviewContributions),followers=count(u.followers.totalCount);
  const result={username:profile.username,status:'fresh',source:'GitHub GraphQL API',fetched_at:to,window:{from,to,contributed:'GitHub repositoriesContributedTo default: past year'},timezone:profile.stats_timezone,stars,commits,prs,issues,contributed:count(u.repositoriesContributedTo.totalCount),total:[...days.values()].reduce((a,d)=>a+d.contributionCount,0),created_at:u.createdAt,rank:calculateRank({all_commits:false,commits,prs,issues,reviews,stars,followers}),streak:streakFromDays([...days.values()],dateInZone(now,profile.stats_timezone))};
  await fs.writeFile(snapshot,JSON.stringify(result,null,2));return result;
 }catch(error){console.warn(`Statistics: ${error.message}; ${last?.fetched_at?'using last-known-good snapshot':'displaying unavailable values'}.`);return last?.fetched_at?{...last,status:'stale'}:emptyStats();}
}
export function localToken(){if(process.env.GH_TOKEN)return process.env.GH_TOKEN;if(process.env.GITHUB_TOKEN)return process.env.GITHUB_TOKEN;try{return execFileSync('gh',['auth','token'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return undefined;}}
