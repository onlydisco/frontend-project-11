import axios from 'axios';
import _ from 'lodash';
import parse from './parser.js';

const updatePosts = (watchedState, proxyUrl, feedId) => {
  axios
    .get(proxyUrl)
    .then((response) => response.data.contents)
    .then((content) => {
      const { posts } = parse(content);

      if (!posts) throw new Error('Parsing Error');

      return posts;
    })
    .then((lastPosts) => {
      const oldPosts = watchedState.data.posts.filter((post) => post.feedId === feedId);
      const oldGuids = oldPosts.map((post) => post.guid);
      const newPosts = lastPosts.filter((post) => !oldGuids.includes(post.guid));

      if (newPosts.length === 0) return;

      newPosts.map((post) => {
        post.feedId = feedId;
        post.id = _.uniqueId();
        watchedState.data.posts.push(post);

        return watchedState.data.posts;
      });
    })
    .catch((error) => console.log(error))
    .finally(() => {
      setTimeout(() => updatePosts(watchedState, proxyUrl, feedId), 5000);
    });
};

export default updatePosts;
