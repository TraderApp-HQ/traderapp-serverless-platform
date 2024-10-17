const esbuild = require('esbuild');
const aliasPlugin = require('esbuild-plugin-alias');
const fs = require('fs');
const path = require('path');

// Function to recursively find all .ts files in a directory
const findEntryPoints = (dir) => {
  let entryPoints = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Recur into subdirectories
      entryPoints = entryPoints.concat(findEntryPoints(fullPath));
    } else if (file.endsWith('.ts')) {
      entryPoints.push(fullPath);
    }
  });
  return entryPoints;
};

// Define the directory where your handlers are located
const handlersDir = path.resolve(__dirname, 'src');

// Get all entry points from the handlers directory
const entryPoints = findEntryPoints(handlersDir);

// Build the esbuild configuration
esbuild.build({
  entryPoints: entryPoints,
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  target: 'es2020',
  absWorkingDir: process.cwd(),
  plugins: [
    aliasPlugin({
      'src': './src'  // Resolve absolute imports from 'src' folder
    })
  ],
  loader: {
    '.ts': 'ts',
    '.js': 'js'
  }
}).catch(() => process.exit(1));
