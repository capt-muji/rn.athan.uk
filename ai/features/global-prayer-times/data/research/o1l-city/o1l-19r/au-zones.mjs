// state assignment for the 218 Diyanet Australia grid points; zone pins the TZ per city.
const WA = 'perth albany bunbury broome carnarvon fremantle geraldton kalgoorlie port-hedland rockingham bayswater-perth cannington gosnells melville nedlands south-perth stirling-perth wanneroo bassendean welshpoolwa mundiwindi'.split(' ')
const NT = 'darwin alice-spring alice-well berrimah noonambah santa-teresa finke hatches-creek barrov-creek'.split(' ')
const SA = 'adelaide port-adelaide mount-gambier murray-bridge whyalla renmark oodnadatta elizabeth enfieldsa salibburysa marion noarlunga payneham woodville burnsidesa teatree-gully salibburysa'.split(' ')
const QLD = 'brisbane gold-coast cairns townsville toowoomba rockhampton mackay gladstone ipswich bundaberg gympie maryborough-q mount-isa emerald-q mornington-q ingham kingaroy nambour bowen ayr redcliffe caboolture caloundra chermside cleveland ashgrove indooroopilly rocklea sandgateq southportq springwood-q roma burpengary croydon-q richmond-q windorah torquay-q mondorah mount-gravatt'.split(' ')
const TAS = 'hobart launceston glenorchy kingston-hobart devonport burnie hamilton-tasmania new-norfolk opossum-bay george-town-t'.split(' ')
export const ZONE = {}
for (const s of WA) ZONE[s] = 'Australia/Perth'
for (const s of NT) ZONE[s] = 'Australia/Darwin'
for (const s of SA) ZONE[s] = 'Australia/Adelaide'
for (const s of QLD) ZONE[s] = 'Australia/Brisbane'
for (const s of TAS) ZONE[s] = 'Australia/Hobart'
export const FALLBACK = 'Australia/Sydney'
// six grid points print on the eastern (+10/+11) clock whatever their label says
export const CLOCK_DEFECT = 'gladstone sandgateq southportq melville richmond-q mondorah'.split(' ')
for (const s of CLOCK_DEFECT) ZONE[s] = 'Australia/Sydney'
const VIC = 'melbourne geelong ballarat bendigo mildura shepparton broadmeadows preston frankston dandenong berwick craigieburn cranbourne doncaster essendon glen-waverley keilor melton moorabbin mooroolbark nunawading prahran springvale sunbury sunshine chelsea mooroopna moe morwell traralgon warragul sale horsham hamilton-v kyabram castlemaine echuca wangaratta wodonga warrnambool portland swan-hill drysdale brighton deer-park maryborough-v knox mona-vale raymond-terrace'.split(' ')
for (const s of VIC) ZONE[s] = 'Australia/Melbourne'
