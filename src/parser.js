const getFeed = (doc) => {
  const docTitle = doc.querySelector('channel title');
  const docDescription = doc.querySelector('channel description');

  const title = docTitle.textContent;
  const description = docDescription.textContent;

  const feed = { title, description };

  return feed;
};

const getPosts = (doc) => {
  const items = doc.querySelectorAll('channel item');

  const posts = [...items].map((item) => {
    const itemTitle = item.querySelector('title');
    const itemDescription = item.querySelector('description');
    const itemLink = item.querySelector('link');

    const title = itemTitle.textContent;
    const description = itemDescription.textContent;
    const link = itemLink.textContent;

    const post = {
      title,
      description,
      link,
    };

    return post;
  });

  return posts;
};

const parse = (content) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    const error = new Error(errorNode.textContent);
    error.isParsingError = true;

    throw error;
  }

  const feed = getFeed(doc);
  const posts = getPosts(doc);

  const data = { feed, posts };

  return data;
};

export default parse;
