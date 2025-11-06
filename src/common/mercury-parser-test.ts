import { parseArticleWithMercury, ParserResult } from './mercury-parser';

/**
 * Test URLs for validating the Mercury Parser implementation
 */
const TEST_URLS = [
	'https://www.theverge.com/2023/12/1/23984183/openai-sam-altman-board-fired-chatgpt', // Tech news
	'https://medium.com/@example/how-to-build-great-products', // Medium article
	'https://techcrunch.com/2023/11/30/ai-startups-funding/', // TechCrunch
	'https://www.bbc.com/news/technology-67123456', // BBC News
	'https://www.lescienze.it/news/2023/11/30/news-example/', // Italian site (existing config)
	'https://invalid-url-test', // Invalid URL test
	'https://404.example.com/nonexistent-page', // 404 test
];

/**
 * Test the Mercury Parser with various scenarios
 */
export async function testMercuryParser(): Promise<void> {
	console.log('🧪 Starting Mercury Parser Tests...\n');

	const results: { url: string; result: ParserResult; duration: number }[] = [];

	for (const url of TEST_URLS) {
		console.log(`📄 Testing: ${url}`);
		const startTime = Date.now();

		try {
			const result = await parseArticleWithMercury(url);
			const duration = Date.now() - startTime;
			
			results.push({ url, result, duration });

			if (result.success) {
				console.log(`✅ Success via ${result.source} (${duration}ms)`);
				console.log(`   Title: ${result.data!.title}`);
				console.log(`   Author: ${result.data!.author || 'Unknown'}`);
				console.log(`   Word count: ${result.data!.word_count}`);
				console.log(`   Domain: ${result.data!.domain}`);
				if (result.retryAttempts) {
					console.log(`   Retry attempts: ${result.retryAttempts}`);
				}
			} else {
				console.log(`❌ Failed: ${result.error!.code} - ${result.error!.message}`);
			}
		} catch (error) {
			const duration = Date.now() - startTime;
			console.log(`💥 Error: ${error} (${duration}ms)`);
			results.push({
				url,
				result: {
					success: false,
					error: {
						code: 'UNEXPECTED_ERROR',
						message: String(error),
						url,
					},
					source: 'none',
				},
				duration,
			});
		}

		console.log(''); // Empty line for readability
	}

	// Print summary
	console.log('📊 Test Summary:');
	console.log('================');
	
	const successful = results.filter(r => r.result.success);
	const failed = results.filter(r => !r.result.success);
	
	console.log(`✅ Successful: ${successful.length}/${results.length}`);
	console.log(`❌ Failed: ${failed.length}/${results.length}`);
	
	if (successful.length > 0) {
		const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
		console.log(`⏱️  Average parsing time: ${Math.round(avgDuration)}ms`);
		
		// Count by source
		const bySources = successful.reduce((acc, r) => {
			const source = r.result.source;
			acc[source] = (acc[source] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		console.log('📈 Success by parser:');
		Object.entries(bySources).forEach(([source, count]) => {
			console.log(`   ${source}: ${count}`);
		});
	}
	
	if (failed.length > 0) {
		console.log('\n❌ Failed URLs:');
		failed.forEach(f => {
			console.log(`   ${f.url}: ${f.result.error!.code}`);
		});
	}
	
	console.log('\n🏁 Mercury Parser tests completed!');
}

/**
 * Test a single URL with detailed output
 */
export async function testSingleUrl(url: string): Promise<ParserResult> {
	console.log(`🧪 Testing single URL: ${url}`);
	console.log('='.repeat(50));

	const startTime = Date.now();
	const result = await parseArticleWithMercury(url);
	const duration = Date.now() - startTime;

	console.log(`⏱️  Duration: ${duration}ms`);
	console.log(`📦 Source: ${result.source}`);
	console.log(`✨ Success: ${result.success}`);

	if (result.success && result.data) {
		const article = result.data;
		console.log('\n📄 Article Details:');
		console.log(`   Title: ${article.title}`);
		console.log(`   Author: ${article.author || 'Unknown'}`);
		console.log(`   Domain: ${article.domain}`);
		console.log(`   Published: ${article.date_published}`);
		console.log(`   Word count: ${article.word_count}`);
		console.log(`   Excerpt: ${article.excerpt?.substring(0, 100)}...`);
		console.log(`   Lead image: ${article.lead_image_url ? 'Yes' : 'No'}`);
		
		if (result.retryAttempts) {
			console.log(`   Retry attempts: ${result.retryAttempts}`);
		}
	} else if (result.error) {
		console.log('\n❌ Error Details:');
		console.log(`   Code: ${result.error.code}`);
		console.log(`   Message: ${result.error.message}`);
		if (result.error.details) {
			console.log(`   Details: ${JSON.stringify(result.error.details, null, 2)}`);
		}
	}

	return result;
}

/**
 * Performance benchmark test
 */
export async function benchmarkParser(url: string, iterations = 5): Promise<void> {
	console.log(`🏃‍♂️ Benchmarking Mercury Parser with ${iterations} iterations`);
	console.log(`📄 URL: ${url}`);
	console.log('='.repeat(60));

	const results: { success: boolean; duration: number; source: string }[] = [];

	for (let i = 1; i <= iterations; i++) {
		console.log(`🔄 Iteration ${i}/${iterations}`);
		
		const startTime = Date.now();
		const result = await parseArticleWithMercury(url);
		const duration = Date.now() - startTime;

		results.push({
			success: result.success,
			duration,
			source: result.source,
		});

		console.log(`   ${result.success ? '✅' : '❌'} ${duration}ms (${result.source})`);
	}

	// Calculate statistics
	const successful = results.filter(r => r.success);
	const durations = successful.map(r => r.duration);
	
	if (durations.length > 0) {
		const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
		const minDuration = Math.min(...durations);
		const maxDuration = Math.max(...durations);
		
		console.log('\n📊 Benchmark Results:');
		console.log(`   Success rate: ${successful.length}/${iterations} (${Math.round(successful.length / iterations * 100)}%)`);
		console.log(`   Average time: ${Math.round(avgDuration)}ms`);
		console.log(`   Min time: ${minDuration}ms`);
		console.log(`   Max time: ${maxDuration}ms`);
		console.log(`   Standard deviation: ${Math.round(calculateStandardDeviation(durations))}ms`);
	} else {
		console.log('\n❌ All iterations failed');
	}
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
	if (values.length <= 1) return 0;
	
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
	const avgSquaredDiff = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
	
	return Math.sqrt(avgSquaredDiff);
}

// Export for use in development console
if (typeof window !== 'undefined') {
	(window as any).testMercuryParser = testMercuryParser;
	(window as any).testSingleUrl = testSingleUrl;
	(window as any).benchmarkParser = benchmarkParser;
}