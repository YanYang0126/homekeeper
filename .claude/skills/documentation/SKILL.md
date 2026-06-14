---
name: documentation
description: Auto-generate README, project docs, installation and deployment guides. Use when creating a new project, adding major features, or preparing for release.
---

## Documentation Skill

When invoked, generate comprehensive project documentation:

### 1. Project Analysis
- Read the project structure and identify key components
- Check existing documentation (README.md, CLAUDE.md)
- Understand the tech stack and architecture
- Identify the target audience (developers, users, contributors)

### 2. README.md Generation
Generate a README with these sections:

```markdown
# Project Name

## Overview
Brief description of what the project does

## Features
- Feature 1: Description
- Feature 2: Description

## Tech Stack
- Frontend: HTML/CSS/JS
- Tools: Listed

## Project Structure
├── index.html
├── app.js
├── styles.css
└── assets/

## Installation
1. Clone the repository
2. Open index.html in browser
3. Or serve with: npx serve .

## Development
- Edit files directly
- Use Live Server for hot reload
- Run tests with: npx vitest

## Deployment
- Static hosting: Netlify, Vercel, GitHub Pages
- PWA: Ensure service-worker.js is registered
- Custom domain setup

## API Reference (if applicable)
- Endpoint documentation

## Contributing
- How to contribute
- Code style guide
- PR process

## License
MIT
```

### 3. API Documentation
For projects with APIs:
- Document each endpoint: method, path, parameters, response
- Include example requests and responses
- Document error codes and messages

### 4. Component Documentation
For UI projects:
- Document each component: purpose, props/attributes, events
- Include usage examples
- Note dependencies and side effects

### 5. Deployment Guide
- Step-by-step deployment instructions
- Environment variables needed
- Build steps (if any)
- Common issues and troubleshooting

### 6. Changelog
- Version history from git tags
- Breaking changes highlighted
- Migration guides for major versions

### Documentation Checklist
- [ ] README.md is comprehensive
- [ ] Installation steps are clear
- [ ] API/component docs are accurate
- [ ] Deployment guide is complete
- [ ] Examples are provided
- [ ] Links are working
- [ ] Screenshots included (for UI projects)
