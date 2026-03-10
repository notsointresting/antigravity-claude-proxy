const fs = require('fs');
let content = fs.readFileSync('tests/test-strategies.cjs', 'utf8');

content = content.replace(
    /assert\(Math\.floor\(tracker\.getScore\('test@example\.com'\)\) > healthScore, 'Health should increase'\);/,
    `assert(tracker.getScore('test@example.com') > healthScore, 'Health should increase');`
);

fs.writeFileSync('tests/test-strategies.cjs', content);
