const path = require('path')

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions
  const blogPost = path.resolve('./src/templates/blog-post.js')

  return graphql(`
    {
      allCosmicjsPosts(sort: { fields: [created], order: DESC }, limit: 1000) {
        edges {
          node {
            slug,
            title
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      throw new Error('Unable to create blog pages: ' + JSON.stringify(result.errors))
    }

    const posts = result.data.allCosmicjsPosts.edges
    createPage({
      path: 'posts',
      component: path.resolve('./src/pages/index.js'),
    })
    posts.forEach((post, index) => {
      const next = index === posts.length - 1 ? null : posts[index + 1].node
      const previous = index === 0 ? null : posts[index - 1].node
      createPage({
        path: `posts/${post.node.slug}`,
        component: blogPost,
        context: { slug: post.node.slug, previous, next },
      })
    })
  })
}
