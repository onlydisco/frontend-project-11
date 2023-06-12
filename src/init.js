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
  };

  const initialState = {
    app: {
      processState: 'initialization',
      feedback: null,
    },
    form: {
      processState: 'filling',
      validLinks: [],
    },
    data: {
      feeds: [],
      posts: [],
    },
    ui: {
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

  // elements.input.addEventListener('change', (event) => {
  //   watchedState.form.link = event.target.value;
  // });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const currentUrl = formData.get('url');

    watchedState.form.processState = 'validating';
    const schema = yupSchema(watchedState.form.validLinks);

    let proxyUrl;

    schema
      .validate(currentUrl)
      .then((link) => {
        watchedState.form.processState = 'valid';
        watchedState.form.validLinks.push(link);
        watchedState.app.processState = 'loading';

        proxyUrl = proxy(link);

        return axios.get(proxyUrl);
      })
      .then((response) => response.data.contents)
      .then((content) => {
        const parsedContent = parse(content);
        const { feed, posts } = parsedContent;

        if (!feed || !posts) throw new Error('Parsing Error');

        feed.id = _.uniqueId();
        watchedState.data.feeds.push(feed);

        posts.map((post) => {
          post.feedId = feed.id;
          post.id = _.uniqueId();
          watchedState.data.posts.push(post);

          return watchedState.data.posts;
        });

        watchedState.app.processState = 'loaded';
        watchedState.app.feedback = 'feedback.succes';
        watchedState.form.processState = 'filling';

        console.log(watchedState);

        return feed.id;
      })
      .then((feedId) => {
        watchedState.app.processState = 'searching';
        setTimeout(() => updatePosts(watchedState, proxyUrl, feedId), 5000);
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
          case 'Error':
            if (error.message === 'Parsing Error') {
              watchedState.app.processState = 'parsingError';
              watchedState.app.feedback = 'feedback.errors.parsing_error';
            }
            break;
          case 'AxiosError':
            if (error.message === 'Network Error') {
              watchedState.app.processState = 'networkError';
              watchedState.app.feedback = 'feedback.errors.network_error';
            }
            break;
          default:
            throw new Error(`Unknown error name ${error.name}`);
        }
      });
  });
};

const init = () => {
  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => app(i18nInstance))
    .catch((error) => {
      throw new Error(`App initialization error: ${error}`);
    });
};

export default init;
