const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { createPages } = require('../gatsby-node')
async function test() {
  for (const data of [null, { allCosmicjsPosts: { edges: [] } }]) {
    const pages = []
    await assert.rejects(createPages({
      graphql: () => Promise.resolve({ errors: ['CMS failed'], data }),
      actions: { createPage: page => pages.push(page) },
    }), /CMS failed/)
    assert.equal(pages.length, 0)
  }
  const pages = []
  const nodes = [{ slug: 'first', title: 'First' }, { slug: 'next', title: 'Next' }]
  await createPages({
    graphql: () => Promise.resolve({ data: { allCosmicjsPosts: { edges: nodes.map(node => ({ node })) } } }),
    actions: { createPage: page => pages.push(page) },
  })
  assert.deepEqual(pages.map(page => page.path), ['posts', 'posts/first', 'posts/next'])
  assert.deepEqual(pages[1].context, { slug: 'first', previous: null, next: nodes[1] })
  assert.deepEqual(pages[2].context, { slug: 'next', previous: nodes[0], next: null })
  for (const file of ['src/pages/index.js', 'src/templates/blog-post.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
    const links = Array.from(source.matchAll(/to=\{(`[^\x60]+`)\}/g), match => match[1])
    assert.equal(links.length, file.includes('templates') ? 2 : 1)
    for (const expression of links) {
      const destination = Function('node', 'previous', 'next', 'return ' + expression)(nodes[1], nodes[1], nodes[1])
      for (const base of ['/', '/posts/', '/posts/current/']) {
        assert.equal(new URL(destination, 'https://example.test' + base).pathname, '/posts/next')
      }
    }
  }
  console.log('PASS: GraphQL failure/success and root/posts/post navigation regressions')
}
test().catch(error => { console.error(error); process.exitCode = 1 })
