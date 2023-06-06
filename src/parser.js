const getFeed = (doc) => {
  const docTitle = doc.querySelector('channel title');
  const docDescription = doc.querySelector('channel description');

  if (!docTitle || !docDescription) return null;

  const title = docTitle.textContent;
  const description = docDescription.textContent;

  const feed = { title, description };

  return feed;
};

const getPosts = (doc) => {
  const items = doc.querySelectorAll('channel item');

  if (!items) return null;

  const posts = [...items].map((item) => {
    const itemTitle = item.querySelector('title');
    const itemDescription = item.querySelector('description');
    const itemGuid = item.querySelector('guid');
    const itemLink = item.querySelector('link');

    const title = itemTitle.textContent;
    const description = itemDescription.textContent;
    const guid = itemGuid.textContent;
    const link = itemLink.textContent;

    const post = { title, description, link, guid };

    return post;
  });

  return posts;
};

const parse = (content) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/xml');

  const feed = getFeed(doc);
  const posts = getPosts(doc);

  const data = { feed, posts };

  return data;
};

export default parse;
