const Blog = () => {
  const posts = [
    {
      title: "First Blog Post",
      date: "2024-02-20",
      excerpt: "An introduction to my thoughts on web development and design.",
      link: "#"
    },
    {
      title: "Second Blog Post",
      date: "2024-02-15",
      excerpt: "Exploring modern web technologies and best practices.",
      link: "#"
    },
    // Add more posts as needed
  ];

  return (
    <div className="page-transition min-h-screen pt-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-8">Blog</h1>
        <div className="space-y-8">
          {posts.map((post, index) => (
            <article
              key={index}
              className="block p-6 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              <time className="text-sm text-muted-foreground">{post.date}</time>
              <h2 className="text-xl font-semibold mt-2 mb-3">{post.title}</h2>
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              <a href={post.link} className="text-primary hover:underline">
                Read more →
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;