// Per-slug copy used by ProjectModal (single detail panel) AND OverviewModal
// (the William Yang tabbed surface). Each entry is uniform so the same modal
// can render any of them.
export const PROJECTS = {
  lyra: {
    title: 'LYRA',
    role: 'Built for Kollmann client',
    accent: '#5cf2ff',
    description:
      'Lyra is a top-tier digital product studio partnering with startups and fast-growing companies to design, develop, and launch exceptional digital experiences. We collaborate with innovative teams from companies like Soma Capital, 88Rising, Paraform, and various YC-backed startups to craft products that are intuitive, visually striking, and built with care.',
    images: ['/pictures/lyratechnologies_cover.jpeg'],
  },
  dappa: {
    title: 'DAPPA',
    role: 'Backend Developer',
    accent: '#ff68ce',
    description:
      'AI-powered Chrome extension that lets users virtually try on outfits by pasting any clothing image link.',
    bullets: [
      'Built the AI try-on generation pipeline that composites user photos with parsed clothing images into realistic outfit shots.',
      'Designed the Chrome-extension ↔ backend API for link submission, async generation polling, and result streaming back to the popup.',
      'Built clothing-image scraping so users could paste any product-page URL and get back a clean garment image ready for try-on.',
      'Implemented image storage + CDN delivery (S3 + signed URLs) for uploads, generations, and saved favorites, plus the swipe/favorites persistence layer.',
    ],
    images: ['/pictures/dappaimage.png'],
  },
  kollmann: {
    title: 'KOLLMANN',
    role: 'Software Engineer',
    accent: '#8a00c4',
    description:
      'Kanban-style commercial real estate deal-management platform for brokers.',
    bullets: [
      'Designed the board → list → card structure with role-based access (admin/member) and multi-board membership.',
      'Shipped a Claude-powered AI search that parses prompts like "Fenway, office, 100–150k SF" into structured filters and ranks scraped CoStar results.',
      'Built Playwright CoStar integration: end-to-end 2FA login, polygon area search, per-listing scraping of suites/contacts/photos.',
      'Built a multi-card Google Maps view with route/transit calcs and lat/lng caching — killed ~2k redundant geocodes per board load.',
    ],
    images: [
      '/pictures/kollmann1.png',
      '/pictures/kollmann2.png',
      '/pictures/kollmann3.png',
    ],
  },
  cba: {
    title: 'COMMBANK',
    role: 'Technology Engineering — Risk Modernisation (Dec 2025 – Jan 2026)',
    accent: '#ffe28a',
    description:
      'Commonwealth Bank — Institutional Banking & Markets, Sydney.',
    bullets: [
      'Engineered features for the Organisation Repository platform used by Institutional Banking risk executives to assess billions in global credit exposure, improving the speed and accuracy of lending decisions.',
      'Delivered the Light-Weight Credit Risk experience in React & TypeScript, reducing time spent reviewing full credit reports by up to 70% and accelerating repayment viability checks.',
    ],
    images: ['/pictures/cbalogo.png'],
  },
  optiver: {
    title: 'OPTIVER',
    role: 'Career Kickstarter — Software (Mar 2026)',
    accent: '#ff5a3c',
    description:
      'Optiver, Sydney — selected for Optiver\'s highly competitive technology program, mentored by industry engineers on quantitative trading and market-making.',
    bullets: [
      'Built a financial exchange in Python using microservices — order book, execution engine, and API gateway — wired together with Protocol Buffers.',
      'Balanced tradeoffs around scalability and low-latency performance across the exchange components.',
    ],
    images: ['/pictures/optiverpic.jpg'],
    imagesBelow: true,
  },
  unsw: {
    title: 'UNSW',
    role: 'Casual Academic',
    accent: '#ffd245',
    description:
      'Tutoring COMP2521 (Data Structures and Algorithms) at UNSW.',
    bullets: [
      'Taught 500+ students across multiple terms.',
      'Consistently ranked in the top 10% of teaching feedback across the school.',
      'Prepare tutorial slides, run weekly labs, mark assignments, and write/mark final exams in C.',
    ],
    images: [
      '/pictures/unsw.png',
      '/pictures/unsw2.png',
      '/pictures/unsw3.png',
    ],
    links: [
      {
        label: 'My slides are here',
        url: 'https://drive.google.com/drive/folders/1MMXis64IOu2j1SWZhV__XV6nBT2TKf2p?usp=sharing',
      },
    ],
  },
  aceverse: {
    title: 'ACEVERSE',
    role: 'Solo build',
    accent: '#5cf2ff',
    description:
      'A "gaming résumé" platform — one shareable profile (aceverse.gg/<handle>) that stitches a player\'s ranks, hours, and recent matches from every game they play into a single view. Think LinkedIn, but for gaming.',
    bullets: [
      'Per-game tiles showing rank, total hours, and last-played pulled from sources like op.gg, tracker.gg, and Steam — no more hopping between a dozen sites.',
      'Unified activity feed that merges match history across every linked game into one chronological timeline.',
      'GitHub-style heatmap that visualizes when a player actually grinds — daily intensity across the year at a glance.',
      'Single public profile URL per handle so a player\'s full competitive history is one link away.',
    ],
    images: [
      '/pictures/aceverse1.png',
      '/pictures/aceverse2.png',
      '/pictures/aceverse3.png',
      '/pictures/aceverse4.png',
    ],
  },
  airtableclone: {
    title: 'AIRTABLE CLONE',
    role: 'Solo build',
    accent: '#fcb400',
    description:
      'A full Airtable clone — workspaces, tables, and views with a spreadsheet-style grid that handles sorting, filtering, grouping, and hiding columns.',
    bullets: [
      'Bulk-insert 100,000 rows in under 20 seconds.',
      'Smooth scrolling on huge tables with sticky frozen columns you can drag to reposition.',
      'Edits feel instant — cell changes show up immediately and sync in the background.',
      'Stackable filters with nested AND/OR groups, drag-and-drop to reorder.',
    ],
    images: [
      '/pictures/airtable1.png',
      '/pictures/airtable2.png',
    ],
  },
  minecrafthack: {
    title: 'MINECRAFT HACK',
    role: 'Solo build',
    accent: '#5ce865',
    description:
      'A Minecraft 1.8.8 hack client built as a uni security project to explore why ~20% of Minecraft players get flagged as cheaters. Minecraft is client-server based and the server trusts the client, so the client can lie about almost anything.',
    bullets: [
      'Kill Aura — auto-attacks any player or mob in range, making 1v1s basically unwinnable for the other player.',
      'Fast Bow — skips the bow draw-time so every arrow fires instantly at full power, turning the bow into a rapid-fire weapon.',
      'Parkour — auto-jumps at the edge of every block, so impossible jumps become trivial.',
      'Plus Flight, Spider (wall-climb), and Dolphin (water-bob) — all classic survival-mode breakers.',
    ],
    images: [
      '/pictures/minecraft.png',
      '/pictures/minecraft2.png',
      '/pictures/minecraft3.png',
    ],
    links: [
      {
        label: 'Watch the demo',
        url: 'https://www.youtube.com/watch?v=yldAVm6_Gqg',
      },
    ],
  },
  unrealengine5: {
    title: 'UNREAL ENGINE 5 PROJECT',
    role: 'Level Designer',
    accent: '#a78bfa',
    description:
      'A horror level built in Unreal 5. Players have to escape a haunted train station — two floors of rooms to explore, items to collect, and an evil opal officer hunting them down.',
    bullets: [
      'Designed a two-floor map with multiple rooms, item spawn points, and randomized coin placements so each run feels different.',
      'Built a hiding system — duck under tables or into lockers (press E) to break line-of-sight from the officer.',
      'Added a flash-stun mechanic — equip the camera, right-click to blind the officer for 2 seconds and buy time to escape.',
      'Layered escape puzzle — find a hammer to break the planks blocking the door, a screwdriver to pry the keypad, the keypad code, the master key, and enough coins to buy a ticket out.',
    ],
    images: [
      '/pictures/unreal1.png',
      '/pictures/unreal2.png',
      '/pictures/unreal3.png',
      '/pictures/unreal4.png',
      '/pictures/unreal5.png',
      '/pictures/unreal6.png',
    ],
  },
};

// Tab data for the William Yang overview modal. Each list is just an array
// of slugs pointing into PROJECTS above.
export const EXPERIENCE = ['kollmann', 'lyra', 'optiver', 'cba', 'dappa', 'unsw'];
export const SIDE_PROJECTS = ['aceverse', 'airtableclone', 'minecrafthack', 'unrealengine5'];

export const CONTACT = {
  email: 'williamyangg05@gmail.com',
  phone: '+64 0423446383',
};

export const FUN_FACTS = [
  '#1 ranked Brawl Stars player in New Zealand.',
  'Reached Emerald in League of Legends after playing for 1 year.',
  'Saved my house from burning down by using the garden hose.',
  'Sang in the best male high school choir in New Zealand.',
  'Played French Horn in the best high school orchestra in New Zealand.',
  'I have perfect pitch and have finished Grade 8 piano.',
];
