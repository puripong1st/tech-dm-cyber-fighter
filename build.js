const fs = require('fs');
const path = require('path');

// Simple .env parser to load local variables
if (fs.existsSync('.env')) {
  console.log('Loading local .env file...');
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const value = trimmed.substring(firstEquals + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const teacherPasscode = process.env.TEACHER_PASSCODE || 'teacher123';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_ANON_KEY environment variables are missing.');
}

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist');

// Ensure clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Files/folders to ignore during build
const ignoreList = [
  'node_modules',
  '.git',
  'dist',
  '.env',
  '.env.example',
  'package.json',
  'package-lock.json',
  'vercel.json',
  'build.js',
  '.gitignore',
  'Prompt.txt',
  'การใช้เทคโนโลยีสารสนเทศ.md'
];

function copyFolderRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(childItemName => {
      if (ignoreList.includes(childItemName)) return;
      copyFolderRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    const ext = path.extname(src).toLowerCase();
    if (ext === '.html') {
      let content = fs.readFileSync(src, 'utf8');
      
      // Inject environment variables into placeholders
      content = content.replace(/SUPABASE_URL_PLACEHOLDER/g, supabaseUrl || '');
      content = content.replace(/SUPABASE_ANON_KEY_PLACEHOLDER/g, supabaseAnonKey || '');
      content = content.replace(/TEACHER_PASSCODE_PLACEHOLDER/g, teacherPasscode);
      
      fs.writeFileSync(dest, content, 'utf8');
      console.log(`Injected variables and wrote: ${path.basename(dest)}`);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Start copying and building
fs.readdirSync(srcDir).forEach(item => {
  if (ignoreList.includes(item)) return;
  copyFolderRecursive(path.join(srcDir, item), path.join(distDir, item));
});

console.log('Build completed successfully!');
