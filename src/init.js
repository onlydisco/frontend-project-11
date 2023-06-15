import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import resources from './locales/index.js';
import watch from './view.js';
import parse from './parser.js';

const yupSchema = (validLinks) => yup.string().required().url().notOneOf(validLinks);

const proxy = (link) => {
  const base = 'https://allorigins.hexlet.app';
  const url = new URL('/get', base);
  url.searchParams.append('disableCache', 'true');
  url.searchParams.append('url', link);

  return url;
};

const addFeedIdAndUrl = (feed, feedUrl) => {
  feed.id = _.uniqueId();
  feed.url = feedUrl;
};

const addPostId = (feedId, posts) => {
  posts.forEach((post) => {
    post.feedId = feedId;
    post.id = _.uniqueId();
  });
};

const loadFeed = (currentUrl, watchedState) => {
  const proxyUrl = proxy(currentUrl);

  return axios
    .get(proxyUrl)
    .then((response) => {
      const parsedContent = parse(response.data.contents);
      const { feed, posts } = parsedContent;

      addFeedIdAndUrl(feed, currentUrl);
      addPostId(feed.id, posts);

      watchedState.data.feeds = [...watchedState.data.feeds, feed];
      watchedState.data.posts = [...watchedState.data.posts, ...posts];

      watchedState.app.processState = 'loaded';
      watchedState.app.feedback = 'feedback.succes';
      watchedState.form.processState = 'filling';
    })
    .catch((error) => {
      console.log(error);

      switch (error.name) {
        case 'AxiosError':
          if (error.message === 'Network Error') {
            watchedState.app.processState = 'networkError';
            watchedState.app.feedback = 'feedback.errors.network_error';
          }
          break;
        case 'Error':
          if (error.message === 'Parsing Error') {
            watchedState.app.processState = 'parsingError';
            watchedState.app.feedback = 'feedback.errors.parsing_error';
          }
          break;
        default:
          throw new Error(`Unknown error name ${error.name}`);
      }
    });
};

const updatePosts = (watchedState) => {
  const promises = watchedState.data.feeds.forEach(({ url, id }) => axios
    .get(proxy(url))
    .then((response) => {
      const { posts } = parse(response.data.contents);

      const oldPosts = watchedState.data.posts.filter(
        (post) => post.feedId === id,
      );
      const oldLinks = oldPosts.map((post) => post.link);
      const newPosts = posts.filter((post) => !oldLinks.includes(post.link));

      if (newPosts.length === 0) return;

      addPostId(id, newPosts);
      watchedState.data.posts = [...watchedState.data.posts, ...newPosts];
    })
    .catch((error) => console.log(error)));

  Promise.all(promises).finally(() => setTimeout(() => updatePosts(watchedState), 5000));
};

const app = (i18nInstance) => {
  const elements = {
    header: document.querySelector('h1'),
    cta: document.querySelector('.lead'),
    form: document.querySelector('.rss-form'),
    input: document.getElementById('url-input'),
    label: document.querySelector('.rss-form label'),
    submit: document.querySelector('button[type="submit"]'),
    example: document.getElementById('example'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modal: document.getElementById('modal'),
  };

  const initialState = {
    app: {
      processState: 'initial',
      feedback: null,
    },
    form: {
      processState: 'filling',
    },
    data: {
      feeds: [],
      posts: [],
    },
    ui: {
      currentPost: null,
      readPosts: [],
    },
  };

  yup.setLocale({
    mixed: {
      notOneOf: 'feedback.errors.duplicate_url',
    },
    string: {
      required: 'feedback.errors.empty_field',
      url: 'feedback.errors.invalid_url',
    },
  });

  const watchedState = watch(initialState, elements, i18nInstance);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const currentUrl = formData.get('url');

    watchedState.form.processState = 'validating';

    const validLinks = watchedState.data.feeds.map((feed) => feed.url);
    const schema = yupSchema(validLinks);

    schema
      .validate(currentUrl)
      .then(() => {
        watchedState.form.processState = 'valid';
        watchedState.app.processState = 'loading';

        loadFeed(currentUrl, watchedState);
      })
      .catch((error) => {
        console.log(error);

        let errorCode;

        switch (error.name) {
          case 'ValidationError':
            [errorCode] = error.errors;
            watchedState.app.feedback = errorCode;
            watchedState.form.processState = 'invalid';
            break;
          default:
            throw new Error(`Unknown error name ${error.name}`);
        }
      });
  });

  elements.posts.addEventListener('click', (event) => {
    const currentPostId = event.target.dataset.id;

    if (currentPostId) {
      watchedState.ui.currentPost = currentPostId;
    }

    if (!watchedState.ui.readPosts.includes(currentPostId)) {
      watchedState.ui.readPosts.push(currentPostId);
    }
  });

  setTimeout(updatePosts(watchedState), 5000);
};

const init = () => {
  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => app(i18nInstance));
};

export default init;
