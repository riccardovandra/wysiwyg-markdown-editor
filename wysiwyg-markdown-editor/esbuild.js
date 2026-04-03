const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	// Build main extension
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			esbuildProblemMatcherPlugin,
		],
	});

	// Build tests (only in non-production mode)
	if (!production) {
		const testCtx = await esbuild.context({
			entryPoints: [
				'src/extension/__tests__/extension.test.ts',
				'src/extension/__tests__/editorProvider.test.ts',
				'src/extension/__tests__/editorRegistry.test.ts',
				'src/extension/__tests__/cooldownManager.test.ts',
				'src/extension/__tests__/linkHandler.test.ts'
			],
			bundle: true,
			format: 'cjs',
			sourcemap: true,
			platform: 'node',
			outdir: 'out/test',
			external: ['vscode', 'mocha', 'assert'],
			logLevel: 'silent',
			plugins: [
				esbuildProblemMatcherPlugin,
			],
		});
		await testCtx.rebuild();
		await testCtx.dispose();
	}

	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
