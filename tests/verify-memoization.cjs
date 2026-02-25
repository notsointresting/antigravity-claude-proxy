'use strict';

async function run() {
    const { getGotScrapingOptions } = await import('../src/utils/helpers.js');

    console.log('--- Verifying getGotScrapingOptions ---');
    const options1 = getGotScrapingOptions();

    // Check if property assignment throws or is ignored
    try {
        options1.newProp = 'fail';
        // If we get here, check if it was added
        if (options1.newProp === 'fail') {
             console.error('❌ Object is NOT frozen (mutation succeeded)');
             process.exit(1);
        } else {
             console.log('✅ Object is frozen (mutation ignored silently)');
        }
    } catch (e) {
        console.log('✅ Object is frozen (mutation threw error)');
    }

    // Check array mutation (push always throws on frozen array)
    try {
        options1.browsers.push({});
        console.error('❌ Object browsers array is NOT frozen');
        process.exit(1);
    } catch (e) {
        console.log('✅ Object browsers array is frozen');
    }
}

run();
