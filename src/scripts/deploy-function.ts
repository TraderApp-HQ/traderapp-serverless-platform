/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as yaml from 'js-yaml';
import archiver from 'archiver';

interface FunctionConfig {
    logicalId: string;
    handler: string;
    queue?: string;
    dependencies: string[];
}

const TEMPLATE_PATH = path.join(__dirname, '../../template.yaml');
const SRC_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(__dirname, '../../dist');

// Custom YAML loader that handles CloudFormation tags
function loadCloudFormationTemplate(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf-8');

    const schema = yaml.DEFAULT_SCHEMA.extend([
        new yaml.Type('!Ref', {
            kind: 'scalar',
            construct: (data) => ({ Ref: data }),
        }),
        new yaml.Type('!GetAtt', {
            kind: 'scalar',
            construct: (data) => {
                const parts = data.split('.');
                return { 'Fn::GetAtt': parts };
            },
        }),
        new yaml.Type('!Sub', {
            kind: 'scalar',
            construct: (data) => ({ 'Fn::Sub': data }),
        }),
        new yaml.Type('!Join', {
            kind: 'sequence',
            construct: (data) => ({ 'Fn::Join': data }),
        }),
        new yaml.Type('!Equals', {
            kind: 'sequence',
            construct: (data) => ({ 'Fn::Equals': data }),
        }),
        new yaml.Type('!Not', {
            kind: 'sequence',
            construct: (data) => ({ 'Fn::Not': data }),
        }),
        new yaml.Type('!If', {
            kind: 'sequence',
            construct: (data) => ({ 'Fn::If': data }),
        }),
    ]);

    return yaml.load(content, { schema });
}

async function parseFunctionName(input: string): Promise<FunctionConfig | null> {
    const template = loadCloudFormationTemplate(TEMPLATE_PATH);

    const resources = template.Resources || {};

    for (const [logicalId, config] of Object.entries(resources)) {
        if (logicalId.toLowerCase().includes(input.toLowerCase()) && (config as any).Type === 'AWS::Serverless::Function') {
            const func = config as any;
            return {
                logicalId,
                handler: func.Properties?.Handler || '',
                queue: func.Properties?.Events?.SQSQueueEvent?.Properties?.Queue?.['Fn::GetAtt']?.[0],
                dependencies: extractDependencies(func.Properties?.Handler || ''),
            };
        }
    }
    return null;
}

function extractDependencies(handler: string): string[] {
    const match = handler.match(/dist\/(.+?)\.handler/);
    if (!match) return [];

    const handlerPath = match[1];
    const dependencies: string[] = ['src/common', `src/${handlerPath.replace(/\//g, '/')}`];

    return dependencies.filter(dep => fs.existsSync(path.join(SRC_DIR, dep)));
}

function runCommand(command: string, args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        proc.on('error', reject);
    });
}

function zipDirectory(source: string, out: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const stream = fs.createWriteStream(out);

        archive
            .directory(source, false)
            .on('error', reject)
            .pipe(stream);

        stream.on('close', resolve);
        archive.finalize();
    });
}

async function deployFunction(functionName: string, environment: string = 'dev'): Promise<void> {
    try {
        console.log(`\n🔍 Searching for function: ${functionName}\n`);

        const config = await parseFunctionName(functionName);

        if (!config) {
            console.error(`❌ Function "${functionName}" not found in template.yaml`);
            process.exit(1);
        }

        console.log(`✅ Found function: ${config.logicalId}`);
        console.log(`📦 Handler: ${config.handler}`);
        console.log(`📂 Dependencies: ${config.dependencies.join(', ')}\n`);

        // Step 1: Clean
        console.log('🧹 Cleaning...');
        await runCommand('npm', ['run', 'clean']);

        // Step 2: Compile TypeScript only (skip esbuild for now)
        console.log('\n📦 Compiling TypeScript...');
        await runCommand('npx', ['tsc']);

        // Step 3: Build ESbuild for specific handler
        console.log('\n🔨 Building handler with esbuild...');
        await runCommand('node', ['esbuild.config.js']);

        // Step 4: Create zip of dist folder
        console.log('\n📦 Creating deployment package...');
        const zipPath = path.join(__dirname, `../../${config.logicalId}.zip`);
        await zipDirectory(DIST_DIR, zipPath);

        // Step 5: Update Lambda function code
        console.log(`\n🚀 Updating Lambda function: ${config.logicalId}...\n`);
        const awsFunctionName = `${environment}-${config.logicalId}`;

        await runCommand('aws', [
            'lambda',
            'update-function-code',
            '--function-name', awsFunctionName,
            '--zip-file', `fileb://"${zipPath}"`,
            '--region', 'eu-west-1',
        ]);

        // Clean up zip file
        fs.unlinkSync(zipPath);

        console.log(`\n✅ Successfully deployed: ${config.logicalId}`);
        console.log(`🎉 Function updated: ${awsFunctionName}\n`);

    } catch (error) {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    }
}

const functionName = process.argv[2];
const environment = process.argv[3] || 'dev';

if (!functionName) {
    console.log(`
Usage: npm run deploy-function -- <function-name> [environment]

Examples:
  npm run deploy-function -- sendEmailOtp
  npm run deploy-function -- processBybitOrders prod
  npm run deploy-function -- handleProcessedTrades prod
`);
    process.exit(1);
}

deployFunction(functionName, environment).catch(console.error);