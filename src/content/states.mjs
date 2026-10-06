// FIPS IDs from the Census Bureau; folder groups are organizational only.
const rows = `01 AL Alabama Central
02 AK Alaska Alaska
04 AZ Arizona Mountain
05 AR Arkansas Central
06 CA California Pacific
08 CO Colorado Mountain
09 CT Connecticut Eastern
10 DE Delaware Eastern
12 FL Florida Eastern
13 GA Georgia Eastern
15 HI Hawaii Hawaii
16 ID Idaho Mountain
17 IL Illinois Central
18 IN Indiana Eastern
19 IA Iowa Central
20 KS Kansas Central
21 KY Kentucky Eastern
22 LA Louisiana Central
23 ME Maine Eastern
24 MD Maryland Eastern
25 MA Massachusetts Eastern
26 MI Michigan Eastern
27 MN Minnesota Central
28 MS Mississippi Central
29 MO Missouri Central
30 MT Montana Mountain
31 NE Nebraska Central
32 NV Nevada Pacific
33 NH New Hampshire Eastern
34 NJ New Jersey Eastern
35 NM New Mexico Mountain
36 NY New York Eastern
37 NC North Carolina Eastern
38 ND North Dakota Central
39 OH Ohio Eastern
40 OK Oklahoma Central
41 OR Oregon Pacific
42 PA Pennsylvania Eastern
44 RI Rhode Island Eastern
45 SC South Carolina Eastern
46 SD South Dakota Central
47 TN Tennessee Central
48 TX Texas Central
49 UT Utah Mountain
50 VT Vermont Eastern
51 VA Virginia Eastern
53 WA Washington Pacific
54 WV West Virginia Eastern
55 WI Wisconsin Central
56 WY Wyoming Mountain`;
export const STATES = rows.split('\n').map(row=>{const [fips,code,...rest]=row.split(' ');return {fips,code,name:rest.slice(0,-1).join(' '),group:rest.at(-1)};});
export const CODES = STATES.map(s=>s.code);

export const REGIONS=[{fips:"11",code:"DC",name:"Washington, D.C.",group:"Eastern",kind:"district"}];
export const PLACES=[...STATES.map(s=>({...s,kind:"state"})),...REGIONS];
export const PLACE_CODES=PLACES.map(s=>s.code);
