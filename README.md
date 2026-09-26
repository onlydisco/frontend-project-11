# Hexlet RSS агрегатор

A simple web application for reading RSS feeds. Add an RSS feed URL to follow its posts, preview articles, and automatically receive updates without refreshing the page.

**[Live demo](https://rss-aggregator-onlydisco.vercel.app)**

## Features

- RSS feed URL validation
- Multiple feed support
- Automatic post updates every 5 seconds
- Article previews in a modal window
- Read post highlighting
- User-friendly loading and error states

## Tech stack

JavaScript, Webpack, Axios, Bootstrap, Yup, i18next, and on-change.

## Local development

Requirements: Node.js 18 or newer and npm.

```bash
git clone git@github.com:onlydisco/hexlet-rss-aggregator.git
cd hexlet-rss-aggregator
npm ci
npm start
```

The development server will print the local application URL in the terminal.

## Available commands

```bash
npm start       # Start the development server
npm run build   # Create a production build in dist/
npm run watch   # Rebuild on source changes
npm run lint    # Run the linter
```

## Deployment

The project is configured for deployment on Vercel. The production build command is `npm run build`, and the output directory is `dist`.

## Author

[Sergey Mukhin](https://github.com/onlydisco)

## License

[ISC](LICENSE)
