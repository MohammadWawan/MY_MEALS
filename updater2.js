const fs = require('fs');

const order_file = 'd:\\\\MY MEALS\\\\src\\\\app\\\\order\\\\page.tsx';
let content = fs.readFileSync(order_file, 'utf8');

// Modal Backgrounds
content = content.replace('bg-zinc-900 border border-zinc-800 w-full max-w-2xl', 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl');
content = content.replace('p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-100 dark:bg-zinc-950/50', 'p-8 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50');

// Inputs
content = content.replaceAll('bg-zinc-100 dark:bg-zinc-950 border border-zinc-800', 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800');

// Bottom section
content = content.replace('p-8 bg-zinc-100 dark:bg-zinc-950 flex flex-col gap-4 border-t border-zinc-800', 'p-8 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800');

fs.writeFileSync(order_file, content, 'utf8');
console.log("Done fine-tuning order page light mode.");
